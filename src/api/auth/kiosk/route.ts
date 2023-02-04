import { Router } from "express"
import { grantStoreAuthority, renderWaitUserAuthority, clearStoreAuthority, renderWaitStoreAuthority, clearUserAuthority, grantUserAuthority } from "./controller"
import { checkStoreAuthority, checkUserAuthority } from "./middleware"
export const kioskAuthorityRouter = Router()

//agent form을 rendering합니다.
kioskAuthorityRouter.get("/agent-store", renderWaitStoreAuthority)
//agent form을 받습니다.
kioskAuthorityRouter.post("/agent-store", grantStoreAuthority)
//agent를 제거합니다.
kioskAuthorityRouter.delete("/agent-store", clearStoreAuthority)

//agent의 user wait page를 rendering합니다.
kioskAuthorityRouter.get("/agent-user", checkStoreAuthority, renderWaitUserAuthority)
//agent를 요청한 user가 있는지 확인합니다.
kioskAuthorityRouter.post("/agent-user", checkStoreAuthority, grantUserAuthority)
//agent에서 user를 logout시킵니다.
kioskAuthorityRouter.delete("/agent-user", checkStoreAuthority, checkUserAuthority, clearUserAuthority)



