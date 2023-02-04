import { Router } from "express"
import { oauthSignin, oauthSinginCallback, signout, renderSignin } from './controller/sns';
import { localSignup, localSignin, deleteUser } from "./controller/local"
import { requestAgent } from "./controller/agent"

export const userAuthRouter = Router()
//page
userAuthRouter.get("/signin", renderSignin)

//local 
userAuthRouter.post("/signin", localSignin)
userAuthRouter.post("/signup", localSignup)

//sns
userAuthRouter.get("/signin/:provider", oauthSignin)
userAuthRouter.get("/signin/:provider/callback", oauthSinginCallback)

userAuthRouter.delete("/signout", signout)

//delete user
userAuthRouter.delete("/", deleteUser)

//agent
userAuthRouter.put("/agent", requestAgent)






