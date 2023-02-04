import { Request, Response, NextFunction } from "express"
import { unless } from "express-unless"
import BUser from "../../models/BUser"

export const bUserAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //client가 session을 소유한 상태
        if (req.session?.buser?.id) {
            //client가 소유한 session이 db에 존재하는 buser에 대한 session.
            if (await BUser.findOne({ where: { id: req.session.buser.id } })) {
                return next()
            }
        }

        //session을 소유하지 않고 있거나, 소유한 session이 db에 존재하는 buser가 아닌경우
        return res.redirect("/auth/buser/signin")
    } catch (err) {
        return res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

//for except authentication router
bUserAuthMiddleware.unless = unless