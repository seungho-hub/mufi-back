import { Router } from "express"
import { getOrder, getOrders } from "../controller/order"
export const userOrderRouter = Router()

userOrderRouter.get("/:orderId", getOrder)
userOrderRouter.get("/", getOrders)