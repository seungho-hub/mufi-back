import { Request, Response, NextFunction } from "express"
import { unless } from "express-unless"
import User from "../../models/User"

export const userAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.session?.user?.id) {
            if (await User.findOne({ where: { id: req.session.user.id } })) {
                return next()
            }
        }

        return res.redirect("/auth/user/signin")
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

userAuthMiddleware.unless = unless