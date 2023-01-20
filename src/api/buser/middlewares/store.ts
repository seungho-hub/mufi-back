import { Request, Response, NextFunction } from "express"
import Store from "../../models/Store"

//store authrize check middleware
//1.store api에는 모두 store_id가 querystring으로 들어가야 함.
//2.해당 buser의 store여야 함.
export async function checkStoreAuthorization(req: Request, res: Response, next: NextFunction) {
    const storeId = req.params.storeId

    if (storeId == undefined) {
        res.status(400).json({
            code: 400,
            message: "매장 id가 입력되지 않았습니다."
        })

        return
    }

    const targetStore = await Store.findOne({
        where: {
            id: storeId,
        }
    })

    //storeId로 등뢱된 store가 있는지 확인한다.
    if (targetStore == null) {
        res.status(404).json({
            code: 404,
            message: "매장을 찾지 못했습니다."
        })
        return
    }

    //request를 보내는 buser가 target store에 대한 권한이 있는지 확인한다.
    if (targetStore.getDataValue("buser_id") != req.session.buser.id) {
        res.status(401).json({
            code: 401,
            message: "해당 store에 대한 권한이 없습니다."
        })

        return
    }

    //menu가 store authorization을 거치며 storeId가 parameter에서 떨어지기 때문에 request에 저장해준다.
    req.app.locals.storeId = storeId

    next()
}