import { Router } from "express"
import { order } from "../controller/order"

export const orderRouter = Router()

orderRouter.post("/", order)