import { Router } from "express"
import { createStore, getStore, getStores, deleteStore, updateStore, getOrderOfStore } from "../controller/store"
import { checkStoreAuthorization } from "../middlewares/store"

//"/api/buser/stores"
export const storeRouter = Router()


storeRouter.use("/:storeId", checkStoreAuthorization);

//create
storeRouter.post("/", createStore)

//read
storeRouter.get("/:storeId", getStore)
storeRouter.get("/", getStores)

//update
storeRouter.put("/:storeId", updateStore)

//delete
storeRouter.delete("/:storeId", deleteStore)
