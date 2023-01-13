import { Request, Response } from "express"
import fs from "fs";
import path from "path";

export const customTokenConfig = (req: Request) => {
    if (req.session) {
        if (req.session.buser && req.session.buser.id) {
            return req.session.buser.id;
        } else if (req.session.user && req.session.user.id) {
            return req.session.user.id;
        } else if (req.session.kiosk && req.session.kiosk.store_id && req.session.kiosk.user_id) {
            return req.session.kiosk.store_id, req.session.kiosk.user_id;
        } else {
            return "No session data"
        }
    } else {
        return "No session object";
    }
}


export const errorLoggerConfig = {
    format: ":remote-addr :remote-user :date[clf] :status :method :url - :response-time ms - :remote-addr - :remote-user - :user-agent - :req[header] - :res[header] - :referrer - :http-version - :req[body]",
    options: {
        stream: process.env.NODE_ENV === "test" ? fs.createWriteStream("log/test-error.log", { flags: 'a' }) : fs.createWriteStream('log/error.log', { flags: 'a' }),
        skip: (req: Request, res: Response) => {
            return res.statusCode < 400
        }
    }
}

export const accessLoggerConfig = {
    format: ":remote-addr :remote-user :date[clf] [:method] :url :status :session :res[content-length]",
    options: {
        stream: process.env.NODE_ENV === "test" ? fs.createWriteStream('log/test.log', { flags: 'a' }) : fs.createWriteStream('log/access.log', { flags: 'a' }),
        skip: function (req: Request, res: Response) {
            const ext = path.extname(req.url);
            return res.statusCode >= 400 || (ext === '.css' || ext === '.js' || ext === '.jpg' || ext === '.png')
        }
    }
}
