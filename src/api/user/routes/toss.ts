import { Router } from "express"
import { billingAuthSuccess, billingAuthFail } from "../controller/toss"
export const tossRouter = Router()

tossRouter.get("/billing_auth/success", billingAuthSuccess)
tossRouter.get("/billing_auth/fail", billingAuthFail)