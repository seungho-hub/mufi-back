import { Request, Response } from "express"
import Agent from "../../../models/Agent"

//**specific exception cases
//--exception case1. store가 sin을 생성하고 입력해 화성화시킨 상태가 아닐때 그 store_id를 지정해서 agent를 요청할 수 없다.
//--exception case2. user A가 agent를 사용하고 있을 때, user B가 agent를 요청한다면, 거부해야한다. 그 사람이 kiosk device앞에 있다면 충분히 로그아웃 할 수 있을 것.
export async function requestAgent(req: Request, res: Response) {
    try {
        const targetStoreId = req.query.store_id

        const targetAgent = await Agent.findOne({
            where: {
                store_id: targetStoreId,
            }
        })

        //exception case1.
        if (!targetAgent) {
            return res.status(404).json({
                message: "부스가 활성화된 상태가 아닙니다."
            })
        }


        //exception case2.
        if (targetAgent.get("user_id")) {
            return res.status(403).json({
                message: "다른 사용자가 사용중인 부스입니다."
            })
        }

        await targetAgent.update({
            user_id: req.session.user.id
        })

        return res.status(200).json({
            mssage: "권한 위임요청완료",
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}
