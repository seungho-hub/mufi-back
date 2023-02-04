import { Router } from "express"
import { renderHome, renderMenu, renderStore } from "."

export const bUserPageRouter = Router()

bUserPageRouter.get("/home", renderHome)

bUserPageRouter.get("/menu", renderMenu)

bUserPageRouter.get("/store", renderStore)

