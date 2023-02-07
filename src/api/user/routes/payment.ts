import { Router } from "express"
import { getPayment, getPayments,deletePayment } from "../controller/payment"
export const userPaymentRouter = Router()

userPaymentRouter.get("/:paymentId", getPayment)
userPaymentRouter.get("/", getPayments)
userPaymentRouter.delete("/:paymentId", deletePayment)
