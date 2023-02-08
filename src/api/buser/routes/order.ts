import { Router } from "express"
import { getOrder, getOrders } from "../controller/order"
export const buserOrderRouter = Router()

buserOrderRouter.get("/:orderId", getOrder)
buserOrderRouter.get("/", getOrders)