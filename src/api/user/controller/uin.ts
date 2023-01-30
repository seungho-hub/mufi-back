import { Request, Response } from "express";
import Uin from "../../models/Uin";
import { generatePin } from "../../../lib/generator/pin"

export const generateUin = async (req: Request, res: Response) => {
    //generate Store Identifier Number
    const uin = generatePin(6)

    const existSin = await Uin.findOne({
        where: {
            user_id: req.session.user.id
        }
    })

    //sin을 생성하고 5분이 경과되지 않았는데 재생성하려 한다면 기존 sin을 지우고 다시 생성
    if (existSin) {
        Uin.destroy({
            where: {
                user_id: req.session.user.id
            }
        })
    }

    Uin.create({
        user_id: req.session.user.id,
        uin
    })
        .then((createdUin) => {
            //5분 뒤에 제거
            //server가 종료될 경우 삭제되지 않는데, 이는 db schedular에 의해서 하루 뒤에 삭제될 거임.
            setTimeout(() => {
                createdUin.destroy()
                    .then(() => {
                        console.log("uin expired!")
                    })
                    .catch((err) => {
                        throw err
                    })

            }, 300000)

            res.json({
                code: 200,
                data: uin
            })
        })
        .catch(err => {
            throw err
            res.status(500).json({
                code: 500,
                message: "uin을 생성하는 도중알 수 없는 문제가 발생했습니다."
            })
        })
}