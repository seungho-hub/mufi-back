import { Router } from "express"
import { checkStoreAuthorization } from "../middlewares/store"
import { generateSin } from "../controller/sin"
export const sinRouter = Router()

sinRouter.post("/", generateSin)
