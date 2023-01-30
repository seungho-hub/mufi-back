import { Request, Response } from "express";
import Sin from "../../models/Sin"
import md5 from "md5"
import { generatePin } from "../../../lib/generator/pin"

export const generateSin = async (req: Request, res: Response) => {
    try {
        const store_id = req.app.locals.storeId

        //generate Store Identifier Number
        const sin = generatePin(6)

        const existSin = await Sin.findOne({ where: { store_id } })

        if (existSin) {
            await existSin.destroy()
        }

        const generatedSin = await Sin.create({ store_id, sin })

        const publicSinInfo = generatedSin.toJSON()
        delete publicSinInfo.id
        delete publicSinInfo.store_id

        return res.status(201).json({
            data: publicSinInfo,
            messsage: "성공적으로 sin이 발급되었습니다."
        })
    } catch (err) {
        return res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}