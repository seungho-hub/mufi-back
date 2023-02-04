import { Router } from "express"
import { renderHome } from "./home"
import { QRrouter } from "./routes/QR"
export const userPageRouter = Router()

userPageRouter.get("/", renderHome)
userPageRouter.use("/qr", QRrouter)