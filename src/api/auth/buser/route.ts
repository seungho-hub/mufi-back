import { Router } from "express"
import { renderSignin, renderSignup, signin, signup, signout, deleteBUser, sendOTP, verifyOTP } from "./controller"
import { bUserAuthMiddleware } from "./middleware"
//"/auth/buser/"
export const bUserAuthRouter = Router()

bUserAuthRouter.get("/signin", renderSignin)

bUserAuthRouter.post("/signin", signin)

bUserAuthRouter.get("/signup", renderSignup)

bUserAuthRouter.post("/signup", signup)

bUserAuthRouter.delete('/signout', signout)

bUserAuthRouter.delete("/", bUserAuthMiddleware, deleteBUser)

bUserAuthRouter.post("/signup/otp/send", sendOTP)
bUserAuthRouter.post("/signup/otp/verify", verifyOTP)