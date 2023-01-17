import { Router, Request, Response } from "express"
import Sin from "../../models/Sin"
import Uin from "../../models/Uin"
import QRCode from "qrcode"
import Agent from "../../models/Agent"

import md5 from "md5"

//specific exceptions
//exception case1. sin이 입력되지 않았다면 거부
//exception case2. 입력한 sin이 유효하지 않다면 거부
//exception case3. 이미 sin을 입력받아 agent가 존재한다면, 거부. 새로 sin을 입력하여 agent를 생성하려면 먼저 agent에서 logout해야한다.
export const storeAuthorization = async (req: Request, res: Response) => {
    //request body에서 stroe identifier number를 가져옵니다.
    const inputedSin = req.body.sin

    //exception case1.
    if (inputedSin == undefined) {
        res.status(400).json({
            code: 400,
            message: "sin이 입력되지 않았습니다."
        })

        return
    }

    //exception case3
    if (req.session.kiosk && req.session.kiosk.store_id) {
        res.status(404).json({
            code: 404,
            message: "이미 운영중입니다. 키오스크에서 로그아웃 후 다시 입력해주세요."
        })

        return
    }

    const encrypted_sin = md5(inputedSin)

    Sin.findOne({
        where: {
            encrypted_sin,
        }
    })
        .then((matched_sin) => {
            //exception case2.
            //입력한 sin이 sin table에 존재하지 않는다면
            //예를 들어 buser가 sin을 발급하고 무효화했거나, 5분이 초과되어 제거된 경우가 이에 해당됩니다.
            if (matched_sin == null) {
                res.status(400).json({
                    code: 400,
                    message: "유효하지 않은 sin입니다."
                })

                return
            }


            //kiosk client가 session을 가지고있지 않다면, 부여한다.
            //아래 authorization을 부여할때 undefined error를 방지.
            if (req.session.kiosk == undefined) {
                req.session.kiosk = {
                    store_id: undefined,
                    user_id: undefined
                }
            }

            //store authorization을 부여한다.
            req.session.kiosk.store_id = matched_sin.getDataValue("store_id")

            matched_sin.destroy()
            //agent를 생성한다. 
            return Agent.create({
                store_id: req.session.kiosk.store_id
            })
        })
        //sin의 유효성을 확인하는 위의 과정이 문제없이 종료된경우
        .then(() => {

            res.redirect("/auth/kiosk/user")
        })
        //sin의 유효성을 확인하는 위의 과정 중 문제가 발생했을 경우
        .catch((err) => {
            if (err) {
                res.status(500).json({
                    code: 500,
                    message: "sin을 확인하는 도중에 알 수 없는 문제가 발생했습니다."
                })
            }
        })
}

export const renderStoreAuthorization = async (req: Request, res: Response) => {
    res.render("kiosk/wait-store")
}

export const renderUserAuthorization = async (req: Request, res: Response) => {
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
        res.redirect("/auth/kiosk/store")
    }
}

export const userAuthorization = async (req: Request, res: Response) => {
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

export const userUnAuthorize = async (req: Request, res: Response) => {
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
}

export const storeUnAuthorize = async (req: Request, res: Response) => {
    req.session.kiosk = undefined


    res.redirect("/auth/kiosk/store")
}