import { Request, Response } from "express"
import Menu from "../../../api/models/Menu"
import Payment from "../../../api/models/Payment"
import { v4 } from "uuid"
import Order from "../../../api/models/Order"
import axios from "axios"

export const order = async (req: Request, res: Response) => {
    try {
        const { paymentId, menuId } = req.query

        if (!menuId) {
            return res.status(400).json({ message: "상품이 지정되지 않았습니다." })
        }

        if (!paymentId) {
            return res.status(400).json({ message: "결제수단이 지정되지 않았습니다." })
        }

        const targetMenu = await Menu.findOne({ where: { id: menuId, store_id: req.session.kiosk.store_id } })

        if (!targetMenu) {
            return res.status(404).json({
                message: "상품을 찾을 수 없습니다."
            })
        }

        const paymentOfUser = await Payment.findOne({ where: { id: paymentId, user_id: req.session.kiosk.user_id } })

        if (!paymentOfUser) {
            return res.status(404).json({
                message: "결제수단을 찾을 수 없습니다."
            })
        }

        const response = await axios({
            method: "POST",
            url: `https://api.tosspayments.com/v1/billing/${paymentOfUser.get("toss_billing_key")}`,
            headers: {
                "Authorization": `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ":", "utf-8").toString("base64")}`,
                "Content-type": "application/json"
            },
            data: {
                customerKey: paymentOfUser.getDataValue("user_id"),
                amount: targetMenu.getDataValue("price"),
                orderId: v4(),
                orderName: targetMenu.getDataValue("label"),
            }
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

        return res.status(201).json({
            data: createdOrder,
            message: "결제가 정상적으로 완료되었습니다."
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }


}
