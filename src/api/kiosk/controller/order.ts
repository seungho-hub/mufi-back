import { Request, Response } from "express"
import Menu from "../../../api/models/Menu"
import Payment from "../../../api/models/Payment"
import Order from "../../../api/models/Order"
import tossAPI from "../../../lib/externalAPI/toss"

export const order = async (req: Request, res: Response) => {
    try {
        const { payment_id, menu_id } = req.query

        if (!menu_id) {
            return res.status(400).json({ message: "상품이 지정되지 않았습니다." })
        }

        if (!payment_id) {
            return res.status(400).json({ message: "결제수단이 지정되지 않았습니다." })
        }

        const targetMenu = await Menu.findOne({ where: { id: menu_id, store_id: req.session.kiosk.store_id } })

        if (!targetMenu) {
            return res.status(404).json({
                message: "상품을 찾을 수 없습니다."
            })
        }

        const paymentOfUser = await Payment.findOne({ where: { id: payment_id, user_id: req.session.kiosk.user_id } })

        if (!paymentOfUser) {
            return res.status(404).json({
                message: "결제수단을 찾을 수 없습니다."
            })
        }

        const billingKey = paymentOfUser.get("toss_billing_key") as string

        const response = await tossAPI.order({
            billingKey,
            customerKey: paymentOfUser.getDataValue("user_id"),
            amount: targetMenu.getDataValue("price"),
            orderName: targetMenu.getDataValue("label"),
        })

        if (response.status != 200) {
            throw new Error("toss 결제가 실패")
        }

        const createdOrder = await Order.create({
            ...response.data,
            id: response.data.paymentKey,
            user_id: req.session.kiosk.user_id,
            store_id: req.session.kiosk.store_id,
        });

        const publicOrderInfo = createdOrder.toJSON()
        delete publicOrderInfo.user_id
        delete publicOrderInfo.store_id
        delete publicOrderInfo.requestedAt
        delete publicOrderInfo.approvedAt
        delete publicOrderInfo.suppliedAmount
        delete publicOrderInfo.vat

        return res.status(201).json({
            data: publicOrderInfo,
            message: "결제가 정상적으로 완료되었습니다."
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }


}
