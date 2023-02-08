import { Router } from "express"
import { getMenu, getMenus } from "../controller/menu"

export const kioskMenuRouter = Router()

kioskMenuRouter.get("/:menuId",getMenu)
kioskMenuRouter.get("/", getMenus)