import { Router, Request, Response } from "express"
import Sin from "../../models/Sin"
import QRCode from "qrcode"
import Agent from "../../models/Agent"

export const grantStoreAuthority = async (req: Request, res: Response) => {
    try {
        const sin = req.body.sin

        //sin이 입력되지 않았다면 reject
        if (!sin) {
            return res.status(400).json({
                message: "sin이 입력되지 않았습니다."
            })
        }

        const matchedSin = await Sin.findOne({ where: { sin } })

        //해당 sin을 찾을 수 없다면 reject 
        if (!matchedSin) {
            return res.status(404).json({
                message: "유효하지 않은 sin입니다."
            })
        }

        const store_id = matchedSin.get('store_id') as string

        //agent를 생성한다, 이미 존재한다면 생성하지 않음.
        await Agent.findOrCreate({ where: { store_id } })

        await matchedSin.destroy()

        //session을 부여한다.
        req.session.kiosk = req.session.kiosk || { store_id: undefined, user_id: undefined }

        //store authorization을 부여한다.
        req.session.kiosk.store_id = store_id

        return res.status(200).json({
            message: "store의 권한을 성공적으로 부여받았습니다."
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const renderWaitStoreAuthority = async (req: Request, res: Response) => {
    return res.render("kiosk/wait-store")
}

export const clearStoreAuthority = async (req: Request, res: Response) => {
    try {
        await Agent.destroy({ where: { store_id: req.session.kiosk.store_id } })

        req.session.kiosk.store_id = null

        return res.status(200).json({
            message: "성공적으로 store의 권한을 제거했습니다."
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const renderWaitUserAuthority = async (req: Request, res: Response) => {
    const qrDataURL = await QRCode.toDataURL(`${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/auth/user/agent?store_id=${req.session.kiosk.store_id}`)

    return res.render("kiosk/wait-user", { qrDataURL })
}

export const clearUserAuthority = async (req: Request, res: Response) => {
    try {
        const isUpdated = await Agent.update({ user_id: null }, { where: { store_id: req.session.kiosk.store_id } })

        req.session.kiosk.user_id = null

        return res.status(200).json({
            message: "user의 권한을 성공적으로 제거했습니다."
        })

    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const grantUserAuthority = async (req: Request, res: Response) => {
    try {
        const agent = await Agent.findOne({ where: { store_id: req.session.kiosk.store_id, } })

        const user_id = agent.get("user_id") as string

        if (!user_id) {
            return res.status(404).json({
                message: "Agent를 요청한 사용자가 없습니다."
            })
        }

        req.session.kiosk.user_id = user_id

        return res.status(200).json({
            message: "user의 권한을 정상적으로 부여받았습니다."
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

