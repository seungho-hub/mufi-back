import { Request, Response } from "express"
import User from "../../../models/User"
import bcrypt from "bcrypt"
import { v4 } from "uuid"
import { ValidationError } from "sequelize"


export const localSignup = async (req: Request, res: Response) => {
    try {
        const { username, tel, password1, password2 } = req.body

        if (password1 != password2) {
            return res.status(400).json({
                message: "비밀번호 확인이 일치하지 않습니다."
            })
        }

        if (await User.findOne({ where: { tel } })) {
            return res.status(409).json({
                message: "해당 전화번호로 등록된 사용자가 존재합니다."
            })
        }

        const uuid = v4()

        const createdUser = await User.create({
            id: uuid,
            tel,
            username,
            password: password1,
            provider: "local"
        })

        const publicUserInfo = createdUser.toJSON()

        delete publicUserInfo.createdAt
        delete publicUserInfo.updatedAt
        delete publicUserInfo.provider
        delete publicUserInfo.encrypted_password

        return res.status(201).json({
            data: {
                user: publicUserInfo
            },
        })
    } catch (err) {
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

export const localSignin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({
                message: "입력되지 않은 필드가 존재합니다."
            })
        }

        const user = await User.findOne({ where: { username, provider: "local" } })

        if (!user || !await bcrypt.compare(password, user.get("encrypted_password"))) {
            return res.status(401).json({
                message: "일치하는 계정이 존재하지 않습니다."
            })
        }

        req.session.user = user

        return res.status(200).json({
            message: "로그인에 성공했습니다."
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

