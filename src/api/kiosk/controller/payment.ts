import { Request, Response } from "express"
import Payment from "../../models/Payment"

export const getPayment = async (req: Request, res: Response) => {
    try {
        const payment = await Payment.findOne({
            where: { id: req.params.paymentId, user_id: req.session.kiosk.user_id },
            attributes: { exclude: ["toss_billing_key", "user_id", "createdAt"] }
        })

        if (!payment) {
            return res.status(404).json({
                message: "결제수단을 찾을 수 없습니다."
            })
        }

        return res.status(200).json({
            data: payment,
            message: "OK"
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export const getsPayment = async (req: Request, res: Response) => {
    try {
        const payments = await Payment.findAll({
            where: { user_id: req.session.kiosk.user_id },
            attributes: { exclude: ["toss_billing_key", "user_id", "createdAt"] }
        })

        return res.status(200).json({
            data: payments,
            message: "OK"
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}