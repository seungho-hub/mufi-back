import { Router } from "express"
import { grantStoreAuthority, renderWaitUserAuthority, clearStoreAuthority, renderWaitStoreAuthority, clearUserAuthority, grantUserAuthority } from "./controller"
import { checkStoreAgent, checkUserAgent } from "./middleware"
export const kioskAuthRouter = Router()

//agent form을 rendering합니다.
kioskAuthRouter.get("/agent-store", renderWaitStoreAuthority)
//agent form을 받습니다.
kioskAuthRouter.post("/agent-store", grantStoreAuthority)
//agent를 제거합니다.
kioskAuthRouter.delete("/agent-store", clearStoreAuthority)

//agent의 user wait page를 rendering합니다.
kioskAuthRouter.get("/agent-user", checkStoreAgent, renderWaitUserAuthority)
//agent를 요청한 user가 있는지 확인합니다.
kioskAuthRouter.post("/agent-user", checkStoreAgent, grantUserAuthority)
//agent에서 user를 logout시킵니다.
kioskAuthRouter.delete("/agent-user", checkStoreAgent, checkUserAgent, clearUserAuthority)



