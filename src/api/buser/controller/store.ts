import { Request, Response } from "express"
import Store from "../../models/Store"
import { isZipCode } from "../../../lib/validator/storeValidator"
import { Op } from 'sequelize';

export async function createStore(req: Request, res: Response) {
    const { code, name, description, zip_code, address, detail_address } = req.body

    //field가 모두 채워지지 않았으면 reject
    if ((code && name && description && zip_code && address && detail_address) == undefined) {
        return res.status(400).json({
            error: "required filed is not provided",
            message: "입력 되지 않은 필드가 있습니다."
        })
    }

    try {
        const approvedStore = await Store.findOne({ where: { code } })

        //zip_code형식이 아니라면 reject
        if (!isZipCode(zip_code)) {
            return res.status(400).json({
                error: "Incorrect zip code format.",
                message: "잘못된 우편번호 형식입니다."
            })
        }

        //Mufi에서 승인되지 않았다면 reject
        if (!approvedStore) {
            return res.status(400).json({
                error: "not accepted by Mufi",
                message: "Mufi에서 승인되지 않은 매장입니다."
            })
        }

        //이미 등록된 매장이라면 reject
        if (approvedStore.get("registered")) {
            return res.status(409).json({
                error: "already registered",
                message: "이미 등록된 매장입니다.",
            })
        }

        //Mufi에서 등록은 했지만, 요청을 보낸 buser의 store로 등록되지 않았다면 reject
        if (approvedStore.get("buser_id") != req.session.buser.id) {
            return res.status(403).json({
                error: "forbidden",
                message: "권한이 없습니다."
            })
        }


        await approvedStore.update({
            name,
            description,
            zip_code,
            address,
            detail_address,
            registered: true,
        })

        const registeredStore = await Store.findOne({
            where: {
                id: approvedStore.get("id"),
            },
            attributes: {
                exclude: ["code", "buser_id", "createdAt", "updatedAt"]
            }
        })

        return res.status(201).json({
            data: registeredStore,
            message: "성공적으로 매장이 등록되었습니다.",
        })

    } catch (err) {
        res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export async function getStore(req: Request, res: Response) {
    const targetId = req.params.storeId

    try {
        const store = await Store.findOne({
            where: {
                id: targetId,
                buser_id: req.session.buser.id,
                //Mufi에서 승인만 나고 등록되지 않은 store는 제외한다.
                updatedAt: {
                    [Op.ne]: null,
                }
            },
            attributes: {
                exclude: ["code", "buser_id", "createdAt", "updatedAt"]
            }
        })


        //store를 찾지 못했다면 reject
        if (!store) {
            return res.status(404).json({
                error: "Not Found",
                message: "매장을 찾을 수 없습니다."
            })
        }


        res.status(200).json({
            data: store,
            message: "OK"
        })

    } catch (err) {
        res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
    return
}

export async function getStores(req: Request, res: Response) {
    const stores = await Store.findAll({
        where: {
            buser_id: req.session.buser.id,
            //Mufi에서 승인만 나고 등록되지 않은 store는 제외한다.
            updatedAt: {
                [Op.ne]: null,
            }
        },
        attributes: {
            exclude: ["code", "buser_id", "createdAt", "updatedAt"]
        }
    })

    if (!stores.length) {
        return res.status(404).json({
            error: "Not Found",
            message: "매장이 존재하지 않습니다."
        })
    }

    return res.status(200).json({
        data: stores
    })
}

export async function updateStore(req: Request, res: Response) {
    const targetId = req.params.storeId

    const { name, description, zip_code, address, detail_address } = req.body

    //field가 모두 채워지지 않았으면 reject
    if ((name && description && zip_code && detail_address) == undefined) {
        return res.status(400).json({
            error: "required filed is not provided",
            message: "입력되지 않은 필드가 존재합니다."
        })
    }

    try {
        const targetStore = await Store.findOne({
            where: {
                id: targetId,
                buser_id: req.session.buser.id
            }
        })

        //store를 찾을 수 없으면 reject
        if (!targetStore) {
            return res.status(404).json({
                error: "Not Found",
                message: "매장을 찾을 수 없습니다."
            })
        }

        //Mufi에서 승인만 나고 등록되지 않은 store를 update하려고 한다면 reject
        if (targetStore.get("registered") == false) {
            return res.status(400).json({
                error: "Bad Request",
                message: "생성 보류중인 매장입니다."
            })
        }

        const updatedStore = await targetStore.update({
            name,
            description,
            zip_code,
            address,
            detail_address
        })

        return res.status(200).json({
            data: updatedStore,
        })

    } catch (err) {
        return res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export async function deleteStore(req: Request, res: Response) {
    const targetId = req.params.storeId

    try {
        const targetStore = await Store.findOne({
            where: {
                id: targetId,
                buser_id: req.session.buser.id,
                updatedAt: {
                    [Op.ne]: null,
                }
            }
        })

        //store를 찾을 수 없으면 reject
        if (!targetStore) {
            return res.status(404).json({
                error: "Not Found",
                message: "매장을 찾을 수 없습니다."
            })
        }

        await targetStore.destroy()

        return res.status(204).json({
            message: "매장이 정상적으로 삭제되었습니다."
        });

    } catch (err) {
        return res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

