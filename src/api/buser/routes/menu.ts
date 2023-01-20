import { Router } from "express"
import { getMenu, getMenus, createMenu, deleteMenu } from "../controller/menu"
import { checkStoreAuthorization } from "../middlewares/store"

// "/api/buser/stores/:storeId/menus/:menuId"
export const menuRouter = Router()

menuRouter.get("/:menuId", getMenu)

menuRouter.get("/", getMenus)

menuRouter.post("/", createMenu)

menuRouter.delete("/:menuId", deleteMenu)




