import { Request, Response, NextFunction } from "express"

export const checkGotStoreAuthorization = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.kiosk && req.session.kiosk.store_id) {
        return next()
    }

    res.redirect("/auth/kiosk/agent-store")
}

export const checkGotUserAuthorization = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.kiosk && req.session.kiosk.user_id) {
        return next()
    }

    res.redirect("/auth/kiosk/agent-user")
}