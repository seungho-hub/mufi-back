import { Router } from "express"
import { getPayment, getPayments } from "../controller/payment"
export const PaymentRouter = Router()

PaymentRouter.get("/:paymentId", getPayment)
PaymentRouter.get("/", getPayments)
