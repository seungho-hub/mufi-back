import { Request, Response } from "express"
import { UploadedFile } from "express-fileupload";
import Menu from "../../models/Menu";
import Order from "../../models/Order"
import path from "path"
import mime from "mime-types"
import { v4 } from "uuid"
import Store from "../../models/Store"
import { ValidationError, QueryError, Op } from 'sequelize';

//create store with body from
//except case
//1.empty value exist
//2.not registered store code by mufi
//3.store exist with store code
//4.updated at field of store not null

export async function createStore(req: Request, res: Response) {
    //name, description, zip_code, detail_address
    const { code, name, description, zip_code, address, detail_address } = req.body

    if ((code && name && description && zip_code && address && detail_address) == undefined) {
        res.status(400).json({
            code: 400,
            message: "입력 되지 않은 필드가 있습니다."
        })
        return
    }

    const buser_id = req.session.buser.id

    const registered_store = await Store.findOne({ where: { code } })

    //등록된 code가 아닌 경우
    if (registered_store == null) {
        res.status(400).json({
            code: 400,
            message: "등록된 매장이 아닙니다, Mufi에 문의해주세요."
        })

        return
    }

    if (registered_store.getDataValue("registered")) {
        res.status(400).json({
            code: 400,
            message: "이미 등록된 매장입니다.",
        })

        return
    }

    Store.update({
        name,
        description,
        zip_code,
        address,
        detail_address,
        registered: true,
    },
        {
            where: { code },
        })
        .then((affectedCount) => {
            res.status(200).json({
                code: 200,
                message: "성공적으로 매장이 등록되었습니다.",
            })

            return
        })
        .catch(err => {
            if (err instanceof ValidationError) {
                res.status(400).json({
                    code: 400,
                    message: "입력 값이 유효하지 않습니다."
                })

                return
            }

            res.status(500).json({
                code: 500,
                message: "알 수 없는 에러가 발생했습니다."
            })

            return
        })
}

export async function getStore(req: Request, res: Response) {
    const targetId = req.params.storeId

    const store = await Store.findOne({
        where: {
            id: targetId,
            updatedAt: {
                [Op.ne]: null,
            }
        }
    })

    if (store == null) {
        res.status(404).json({
            code: 404,
            message: "해당 id와 일치하는 매장을 찾지 못했습니다."
        })
        return
    }


    res.status(200).json({
        code: 200,
        data: store
    })

    return
}

export async function getStores(req: Request, res: Response) {
    const stores = await Store.findAll({
        where: {
            buser_id: req.session.buser.id,
            updatedAt: {
                [Op.ne]: null,
            }
        }
    })

    if (stores == null) {
        res.status(404).json({
            code: 404,
            message: "매장이 존재하지 않습니다."
        })

        return
    }

    res.status(200).json({
        code: 200,
        data: stores,
    })

    return
}
export async function updateStore(req: Request, res: Response) {
    const targetId = req.params.storeId

    if (targetId == undefined) {
        res.status(400).json({
            code: 400,
            message: "매장의 id를 지정해주세요."
        })
        return
    }

    const { name, description, zip_code, address, detail_address } = req.body

    if ((name && description && zip_code && detail_address) == undefined) {
        res.status(400).json({
            code: 400,
            message: "입력되지 않은 필드가 존재합니다."
        })
        return
    }

    const targetStore = await Store.findOne({
        where: {
            id: targetId,
            buser_id: req.session.buser.id
        }
    })

    if (targetStore == null) {
        res.status(404).json({
            code: 404,
            message: "매장을 찾을 수 없습니다."
        })
        return
    }

    if (targetStore.getDataValue("registered") == false) {
        res.status(400).json({
            code: 404,
            message: "생성 보류중인 매장입니다."
        })
        return
    }

    targetStore.update({
        name,
        description,
        zip_code,
        address,
        detail_address
    })
        .then((updatedStore) => {
            res.status(200).json({
                code: 200,
                message: "매장 정보가 성공적으로 업데이트 됐습니다."
            })
        })
        .catch(err => {
            res.status(500).json({
                code: 500,
                message: "매장 정보를 업데이트하는 도중에 알 수 없는 문제가 발생했습니다."
            })
        })
}

//delete store
export async function deleteStore(req: Request, res: Response) {
    const targetId = req.params.storeId

    if (targetId == undefined) {
        res.status(400).json({
            code: 400,
            message: "삭제할 매장의 id가 지정되지 않았습니다."
        })
        return
    }

    //request를 보낸 user의 store중, target id와 일치하는 매장을 찾는다.
    const targetStore = await Store.findOne({
        where: {
            id: targetId,
            buser_id: req.session.buser.id
        }
    })

    if (targetStore == null) {
        res.status(404).json({
            code: 404,
            message: "매장을 찾지 못했습니다.",
            info: targetId + req.session.buser.id
        })
        return
    }

    targetStore.destroy()
        .then(() => {
            res.status(200).json({
                code: 200,
                message: "매장이 정상적으로 삭제되었습니다."
            })
        })
        .catch(err => {
            res.status(500).json({
                code: 500,
                message: "매장을 삭제하는 도중 알 수 없는 문제가 발생했습니다."
            })
        })
}

//get order from store
export async function getOrderOfStore(req: Request, res: Response) {
    const targetStoreId = req.query.store_id

    if (targetStoreId == undefined) {
        res.status(400).json({
            code: 400,
            message: "store id가 지정되지 않았습니다."
        })
        return
    }

    Order.findAll({
        where: {
            store_id: targetStoreId,
        }
    })
        .then((orders) => {
            res.status(200).json({
                code: 200,
                data: {
                    orders
                }
            })
        })
        .catch(err => {
            throw err
            res.status(500).json({
                code: 500,
                message: "server internel error"
            })
        })
}

// export async function createPhoto(req : Request, res: Response){
//     const targetStoreId = req.params.store_id

//     const image: UploadedFile = req.files.image as UploadedFile

//     image.mv()
// }

