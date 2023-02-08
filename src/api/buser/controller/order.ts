import { Request, Response } from "express"
import Order from "../../models/Order"

export async function getOrder(req: Request, res: Response) {
    try {
        const orderId = req.params.orderId
        const storeId = req.app.locals.storeId

        const order = await Order.findOne({ where: { store_id: storeId, id: orderId } })

        if (!order) {
            return res.status(404).json({
                message: "내역을 찾을 수 없습니다."
            })
        }

        return res.status(200).json({
            data: order,
            message: "OK",
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export async function getOrders(req: Request, res: Response) {
    try {
        const storeId = req.app.locals.storeId

        const orders = await Order.findAll({ where: { store_id: storeId } })

        return res.status(200).json({
            data: orders,
            message: "OK"
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}
