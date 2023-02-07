import Buser from "../../models/BUser"
import { v4 } from "uuid"
import bcrypt from "bcrypt"
import { Request, Response } from "express"
import { ValidationError } from "sequelize"
import { generatePin } from "../../../lib/generator/pin"
import nodeCache from "node-cache"
import aligoAPI from "../../config/aligo"

const mufiCache = new nodeCache({
    stdTTL: 60 * 3,
    checkperiod: 600,
})

type VerifyInfo = {
    otp: string,
    verified: boolean,
    count: number,
}

export const renderSignin = async (req: Request, res: Response) => {
    return res.render("buser/auth/signin")
}

export const signin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body

        //비워진 field가 존재한다면 reject
        if (!username || !password) {
            return res.status(400).json({
                message: "입력되지 않은 정보가 존재합니다."
            })
        }

        const buser = await Buser.findOne({ where: { username } })

        //해당 username으로 등록된 user가 없다면 reject
        if (!buser || !await bcrypt.compare(password, buser.get("encrypted_password") as string)) {
            //sign in failed message have to does not include reason 
            return res.status(401).json({
                message: "일치하는 계정이 존재하지 않습니다."
            })
        }

        req.session.buser = buser

        return res.status(200).json({
            message: "로그인에 성공했습니다."
        })

    }
    catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const renderSignup = (req: Request, res: Response) => {
    return res.render("buser/auth/signup")
}

export const signup = async (req: Request, res: Response) => {
    const { username, tel, password1, password2 } = req.body

    //비워진 field가 존재한다면 reject
    if (!username || !tel || !password1 || !password2) {
        return res.status(400).json({
            message: "입력되지 않은 정보가 있습니다."
        })
    }

    try {
        // 해당 username으로 등록된 사용자가 존재한다면 reject
        if (await Buser.findOne({ where: { username } })) {
            return res.status(409).json({
                message: "이미 사용중인 이름입니다."
            })
        }


        // 해당 전화번호로 등록된 사용자가 존재한다면 reject
        if (await Buser.findOne({ where: { tel } })) {
            return res.status(409).json({
                message: "해당 전화번호로 등록된 사용자가 존재합니다."
            })
        }

        //비밀번호 확인 일치하지 않으면 reject
        if (password1 != password2) {
            return res.status(400).json({
                message: "비밀번호확인이 일치하지 않습니다."
            })
        }

        const verifInfo: VerifyInfo = mufiCache.get(tel)

        if (!verifInfo?.verified) {
            return res.status(400).json({
                message: "전화번호 인증이 확인되지 않았습니다."
            })
        }

        //generate uuid for Buser id
        const id = v4()

        const createdBuser = await Buser.create({
            id,
            username,
            password: password1,
            tel
        })

        const publicBuserInfo = createdBuser.toJSON()
        delete publicBuserInfo.encrypted_password
        delete publicBuserInfo.createdAt
        delete publicBuserInfo.updatedAt

        return res.status(201).json({
            data: publicBuserInfo,
            message: "buser created successfully"
        })

    }
    catch (err) {
        if (err instanceof ValidationError) {
            return res.status(400).json({
                message: err.errors[0].message
            })
        }

        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const signout = (req: Request, res: Response) => {
    try {
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
            message: "성공적으로 로그아웃 되었습니다."
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const deleteBUser = async (req: Request, res: Response) => {
    try {
        await Buser.destroy({ where: { id: req.session.buser.id } })

        req.session.destroy(null)

        return res.status(204).end()
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const sendOTP = async (req: Request, res: Response) => {
    try {
        const { tel } = req.body

        if (!tel) {
            return res.status(400).json({
                message: "휴대폰 번호를 확인할 수 없습니다."
            })
        }

        if (await Buser.findOne({ where: { tel } })) {
            return res.status(409).json({
                message: "해당 전화번호로 등록된 사용자가 존재합니다."
            })
        }

        const otp = generatePin(6)

        if (!mufiCache.set(tel, { otp, verified: false })) {
            throw new Error("cache값 설정중 문제가 발생했습니다.")
        }

        setInterval(() => { mufiCache.del(tel) }, 180000)


        const response = await aligoAPI.send(`[${otp}] 알리고 인증번호입니다.`, tel)

        if (response.data.result_code != 1) {
            throw new Error("aligo 문자 발송 api 요청에 문제가 발생했습니다.")
        }

        return res.status(200).json({
            message: "인증번호가 전송되었습니다."
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { tel, otp } = req.body

        if (!otp) {
            return res.status(400).json({
                message: "인증번호를 입력해주세요"
            })
        }

        if (!tel) {
            return res.status(400).json({
                message: "전화번호를 입력해주세요"
            })
        }

        const verifInfo:VerifyInfo = mufiCache.get(tel)

        if (!verifInfo) {
            return res.status(404).json({
                message: "인증에 실패했습니다."
            })
        }

        if (verifInfo.verified) {
            return res.status(403).json({
                message: "이미 인증이 완료되었습니다."
            })
        }

        if (verifInfo?.otp != otp) {
            return res.status(401).json({
                message: "인증번호가 일치하지 않습니다."
            })
        }

        verifInfo.verified = true

        mufiCache.set(tel, verifInfo)

        return res.status(200).json({
            message: "인증이 완료되었습니다."
        })

    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}
