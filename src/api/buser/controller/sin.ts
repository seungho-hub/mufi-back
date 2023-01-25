import { Request, Response } from "express";
import Sin from "../../models/Sin"
import md5 from "md5"

const gpc = require("generate-pincode")

export const generateSin = async (req: Request, res: Response) => {
    try {
        const store_id = req.app.locals.storeId

        //generate Store Identifier Number
        const sin = gpc(6)
        const encrypted_sin = md5(sin)

        const existSin = await Sin.findOne({ where: { store_id } })

        if (existSin) {
            await existSin.destroy()
        }

        const generatedSin = await Sin.create({ store_id, encrypted_sin })

        return res.status(201).json({
            data: generatedSin,
            messsage: "성공적으로 sin이 발급되었습니다."
        })
    } catch (err) {
        return res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}