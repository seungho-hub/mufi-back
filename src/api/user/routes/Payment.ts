import { Router } from "express"
import { getPayment, getPayments } from "../controller/Payment"
import { userAuthenticated } from "../../auth/user/middleware"
export const PaymentRouter = Router()

// "/api/user/payment"
PaymentRouter.use(userAuthenticated)
PaymentRouter.get("/:paymentId", getPayment)
PaymentRouter.get("/", getPayments)
