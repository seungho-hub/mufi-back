import { Router, Request, Response } from "express"
import Sin from "../../models/Sin"
import Uin from "../../models/Uin"
import QRCode from "qrcode"
import Agent from "../../models/Agent"

import md5 from "md5"


//request method가 GET이라면 agent form을 rendering하고, POST라면 agent를 생성한다.
//specific exceptions
//exception case1. sin이 입력되지 않았다면 거부
//exception case2. 입력한 sin이 유효하지 않다면 거부
export const storeAgent = async (req: Request, res: Response) => {
    //if request with GET method, render agent form
    if (req.method === "GET") {
        return res.render("kiosk/wait-store")
    }

    //if request with delete method, signout from agent
    if (req.method === "DELETE") {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).json({
                    error: "server error",
                    message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
                })
            }
        })

        res.clearCookie("mufi.sid")

        return res.status(200).json({
            message: "성공적으로 store의 권한을 제거했습니다."
        })
    }

    if (req.method === "POST") {
        try {
            //request body에서 stroe identifier number를 가져옵니다.
            const sin = req.body.sin

            //exception case1.
            if (!sin) {
                res.status(400).json({
                    code: 400,
                    message: "sin이 입력되지 않았습니다."
                })

                return
            }

            const matchedSin = await Sin.findOne({ where: { sin } })

            //exception case2.
            if (!matchedSin) {
                return res.status(404).json({
                    err: "Not Found",
                    message: "유효하지 않은 sin입니다."
                })
            }

            req.session.kiosk = req.session.kiosk || { store_id: undefined, user_id: undefined }

            //store authorization을 부여한다.
            req.session.kiosk.store_id = matchedSin.get("store_id") as string

            await matchedSin.destroy()
            //agent를 생성한다. 
            await Agent.findOrCreate({
                where: {
                    store_id: req.session.kiosk.store_id
                }
            })


            res.redirect("/auth/kiosk/agent-user")

        } catch (err) {
            res.status(500).json({
                error: "server error",
                message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
            })
        }
    }
}


//[GET] : user가 Agent 요청 request를 보내는 url을 qrcode로 rendering합니다.
//[DELETE] : user가 Agent에서 로그아웃합니다.
//specific exception cases
//exception case1. agent가 아직 생성되지 않아 kiosk에 session이 부여되지 않은 경우
//exception case2. agent가 등록되어있는 상태에서 다시 qr페이지로 돌아갔을 때, 다른 user가 이 qr로 agent를 요청할 수 없음. 이미 사용중인 부스라, 때문에 홈으로 돌려줘야함.
export const userAgent = async (req: Request, res: Response) => {
    if (req.method === "GET") {
        //exception case1.
        if (req.session && req.session.kiosk && req.session.kiosk.store_id) {
            QRCode.toDataURL(`${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/auth/user/agent?store_id=${req.session.kiosk.store_id}`)
                .then((qrDataURL) => {
                    res.render("kiosk/wait-user", { qrDataURL })
                })
                .catch(err => {
                    res.status(500).json({
                        code: 500,
                        message: "qrcode를 생성하는 도중 문제가 발생했습니다."
                    })
                })
        } else {
            res.redirect("/auth/kiosk/agent")
        }

        return
    }

    if (req.method === "DELETE") {
        const agent = await Agent.findOne({
            where: {
                user_id: req.session.kiosk.user_id,
            }
        })

        if (agent) {
            agent.update({
                user_id: null,
            })
        }

        req.session.kiosk.user_id = null
        res.redirect("/auth/kiosk/user")

        return
    }
}

export const userAgentStatus = async (req: Request, res: Response) => {
    const agent = await Agent.findOne({
        where: {
            store_id: req.session.kiosk.store_id,
        }
    })

    if (agent == null) {
        res.status(404).json({
            code: 404,
            message: "권한을 부여하려는 사용자가 없습니다."
        })

        return
    }

    const user_id = agent.getDataValue("user_id")

    if (user_id) {
        req.session.kiosk.user_id = user_id

        res.status(200).json({
            code: 200,
            message: "user의 권한 승인"
        })
    } else {
        res.status(404).json({
            code: 404,
            message: "권한을 부여한 사용자가 없습니다."
        })
    }
}

