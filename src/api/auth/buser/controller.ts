import Buser from "../../models/BUser"
import { v4 } from "uuid"
import argon2 from "argon2"
import { Request, Response } from "express"
import { passwordIsValidate, usernameIsValidate, isEmail } from "../../../lib/validator/buserValidator"

export const renderSignin = async (req: Request, res: Response) => {
    res.render("buser/auth/signin")
}

export const signin = async (req: Request, res: Response) => {
    const { email, password } = req.body

    //비워진 field가 존재한다면 reject
    if (!(email && password)) {
        return res.status(400).json({
            error: "fill all required fields",
            message: "입력되지 않은 정보가 존재합니다."
        })
    }

    //email 형식이 잘못되었다면 reject
    if (!isEmail(email)) {
        return res.status(400).json({
            error: "email is invalid",
            message: "잘못된 이메일 형식입니다."
        })
    }

    try {
        const buser = await Buser.findOne({ where: { email: email } })

        //해당 이메일로 등록된 user가 없다면 reject
        if (buser == null) {
            //sign in failed message have to does not include reason 
            return res.status(401).json({
                error: "account does not exist",
                message: "일치하는 계정이 존재하지 않습니다."
            })
        }

        const passwordVerified = await argon2.verify(buser.getDataValue("encrypted_password"), password)

        //email로 등록된 user를 찾았지만, password가 일치하지 않는다면 reject
        if (!passwordVerified) {
            return res.status(401).json({
                error: "account does not exist",
                message: "일치하는 계정이 존재하지 않습니다."
            })
        }

        //save session 
        req.session.buser = buser

        res.status(200).json({
            message: "signined successfully",
        })

    }
    catch (err) {
        res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const renderSignup = (req: Request, res: Response) => {
    res.render("buser/auth/signup")
}

export const signup = async (req: Request, res: Response) => {
    const { username, email, password1, password2 } = req.body

    //비워진 field가 존재한다면 reject
    if (!(username && email && password1 && password2)) {
        return res.status(400).json({
            error: "fill all required fields",
            message: "입력되지 않은 정보가 있습니다."
        })
    }

    try {
        if (!usernameIsValidate(username)) {
            return res.status(400).json({
                error: "username is not valid",
                message: "사용자 이름은 3글자 이상 20글자 이하여야합니다."
            })
        }

        const usernameOverlabed = await Buser.findOne({ where: { username } })

        //이미 존재하는 이름이라면 reject
        if (usernameOverlabed) {
            return res.status(409).json({
                error: "conflicted username",
                message: "이미 사용중인 이름입니다."
            })
        }

        //email 형식이 잘못되었다면 reject
        if (!isEmail(email)) {
            return res.status(400).json({
                error: "email is invalid",
                message: "잘못된 이메일 형식입니다."
            })
        }

        const emailOberlabUser = await Buser.findOne({ where: { email } })

        //user already exist with email
        if (emailOberlabUser) {
            return res.status(409).json({
                error: "conflicted email",
                message: "해당 이메일로 등록된 사용자가 존재합니다."
            })
        }

        //check password mismatch
        if (password1 != password2) {
            return res.status(400).json({
                error: "password mismatch",
                message: "비밀번호확인이 일치하지 않습니다."
            })
        }

        //strong password가 아니라면
        if (!passwordIsValidate(password1)) {
            return res.status(400).json({
                error: "strong password required",
                message: "비밀번호는 숫자,대문자,소문자를 적어도 하나씩 포함해야하며 8자 이상 30자 이하여야합니다."
            })
        }


        //hash password
        const encrypted_password = await argon2.hash(password1)

        //generate uuid for user id
        const id = v4()

        const buser = await Buser.create({
            id,
            username,
            encrypted_password,
            email,
        })

        req.session.buser = buser

        return res.status(201).json({
            message: "buser created successfully"
        })

    }
    catch (err) {
        res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const signout = (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({
                error: "server error",
                message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
            })
        }
    })

    res.clearCookie("mufi.sid")

    res.status(200).json({
        message: "성공적으로 로그아웃 되었습니다."
    })
}