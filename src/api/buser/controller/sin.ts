import { Request, Response } from "express";
import Sin from "../../models/Sin"
import md5 from "md5"

const gpc = require("generate-pincode")

export const generateSin = async (req: Request, res: Response) => {
    const store_id = req.app.locals.storeId

    //generate Store Identifier Number
    const sin = gpc(6)
    const encrypted_sin = md5(sin)

    const existSin = await Sin.findOne({
        where: {
            store_id,
        }
    })

    //sin을 생성하고 5분이 경과되지 않았는데 재생성하려 한다면 기존 sin을 지우고 다시 생성
    if (existSin) {
        Sin.destroy({
            where: {
                store_id
            }
        })
    }

    Sin.create({
        store_id,
        encrypted_sin,
    })
        .then((createdSin) => {
            //5분 뒤에 제거
            //server가 종료될 경우 삭제되지 않는데, 이는 db schedular에 의해서 하루 뒤에 삭제될 거임.
            setTimeout(() => {
                createdSin.destroy()
                    .then(() => {
                        console.log("sin expired!")
                    })
                    .catch((err) => {
                        throw err
                    })

            }, 300000)

            res.json({
                code: 200,
                data: sin
            })
        })
        .catch(err => {
            res.status(500).json({
                code: 500,
                message: "sin을 생성하는 도중알 수 없는 문제가 발생했습니다."
            })
        })
}