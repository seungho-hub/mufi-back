import { Router } from "express"
import { renderSignin, renderSignup, signin, signup, signout } from "./controller"

//"/auth/buser/"
export const authBUser = Router()

authBUser.get("/signin", renderSignin)

authBUser.post("/signin", signin)

authBUser.get("/signup", renderSignup)

authBUser.post("/signup", signup)

authBUser.delete('/signout', signout)