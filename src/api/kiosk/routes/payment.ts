import { Router } from "express"
import { getPayment, getsPayment } from "../controller/payment"

export const kioskPaymentRouter = Router()

kioskPaymentRouter.get("/:paymentId", getPayment)
kioskPaymentRouter.get("/", getsPayment)
