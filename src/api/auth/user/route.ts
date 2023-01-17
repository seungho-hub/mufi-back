import { Router } from "express"
import { oauthSignin, oauthSinginCallback, signout, renderSignin, requestAgent } from './controller';

//"/auth/user/"
export const authUser = Router()

authUser.get("/signin", renderSignin)
authUser.get("/signin/:provider", oauthSignin)
authUser.get("/signin/:provider/callback", oauthSinginCallback)
authUser.get("/agent", requestAgent)
authUser.get("signout", signout)






