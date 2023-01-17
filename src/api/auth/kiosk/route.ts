import { Router } from "express"
import { storeAgent, userAgent, userAgentStatus } from "./controller"
export const kioskAuthRouter = Router()

//agent form을 rendering합니다.
kioskAuthRouter.get("/agent-store", storeAgent)
//agent form을 받습니다.
kioskAuthRouter.post("/agent-store", storeAgent)
//agent를 제거합니다.
kioskAuthRouter.delete("/agent-store", storeAgent)

//agent의 user wait page를 rendering합니다.
kioskAuthRouter.get("/agent-user", userAgent)
//agent를 요청한 user가 있는지 확인합니다.
kioskAuthRouter.get("/agent-status", userAgentStatus)
//agent에서 user를 logout시킵니다.
kioskAuthRouter.delete("/agent-user", userAgent)



