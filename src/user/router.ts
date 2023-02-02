import { Router } from "express"
import { renderHome } from "./home"
import { QRrouter } from "./routes/QR"
export const userHomeRouter = Router()

userHomeRouter.get("/", renderHome)
userHomeRouter.use("/qr", QRrouter)