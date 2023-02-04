import { Request, Response, NextFunction } from "express"
import { unless } from "express-unless"
import Agent from "../../models/Agent"

export const checkStoreAuthority = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.kiosk && req.session.kiosk.store_id) {
        const agent = await Agent.findOne({
            where: {
                store_id: req.session.kiosk.store_id
            }
        })

        if (agent) {
            next()
            return
        }
    }

    res.redirect("/auth/kiosk/agent-store")
}

export const checkUserAuthority = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.kiosk && req.session.kiosk.user_id) {
        const agent = await Agent.findOne({
            where: {
                user_id: req.session.kiosk.user_id
            }
        })

        if (agent) {
            next()
            return
        }
    }

    res.redirect("/auth/kiosk/agent-user")
}

checkStoreAuthority.unless = unless
checkUserAuthority.unless = unless

