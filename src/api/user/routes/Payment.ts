import { Router } from "express"
import { getPayment, getPayments } from "../controller/payment"
export const userPaymentRouter = Router()

userPaymentRouter.get("/:paymentId", getPayment)
userPaymentRouter.get("/", getPayments)
