import { Router } from "express"
import { getSelf } from "../controller/buser"
export const buserRouter = Router()

buserRouter.get("/self", getSelf)





