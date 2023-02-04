import { Router } from "express"
import { generateUin } from "../controller/uin"
export const uinRouter = Router()

uinRouter.get("/", generateUin)
