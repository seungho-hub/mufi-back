import { Router } from "express"
import { renderHome } from "./index"

export const kioskPageRouter = Router()

kioskPageRouter.get("/", renderHome)

