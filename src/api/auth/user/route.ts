import { Router } from "express"
import { oauthSignin, oauthSinginCallback, signout, renderSignin } from './controller/sns';
import { localSignup, localSignin } from "./controller/local"
import { requestAgent } from "./controller/agent"
import { userAuthenticated } from "./middleware";
//"/auth/user/"
export const authUser = Router()

authUser.get("/signin", renderSignin)

//local 
authUser.post("/signin", localSignin)
authUser.post("/signup", localSignup)

//sns
authUser.get("/signin/:provider", oauthSignin)
authUser.get("/signin/:provider/callback", oauthSinginCallback)

authUser.delete("/signout", signout)

//agent
authUser.put("/agent", userAuthenticated, requestAgent)






