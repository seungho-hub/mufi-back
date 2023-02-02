import axios from "axios"
import { Request, Response } from "express";
import Payment from "../../models/Payment";
import { v4 } from "uuid"

export const billingAuthSuccess = async (req: Request, res: Response) => {
    try {
        const { customerKey, authKey } = req.query

        if (customerKey != req.session.user.id) {
            return res.status(404).json({
                message: "잘못된 요청입니다."
            })
        }

        const options = {
            method: 'POST',
            url: `https://api.tosspayments.com/v1/billing/authorizations/issue`,
            headers: {
                Authorization: `Basic ${process.env.TOSS_BASIC}`,
                'Content-Type': 'application/json'
            },
            data: { customerKey, authKey }
        };

        const response = await axios.request(options)

        const billingKey = response.data.billingKey
        const card = response.data.card

        const createdPayment = await Payment.create({
            id: v4(),
            user_id: req.session.user.id,
            toss_billing_key: billingKey,
            card_company: card.company,
            card_type: card.cardType,
            card_number: card.number,
            card_owner_type: card.ownerType,
        })

        const publicPaymentInfo = createdPayment.toJSON()
        delete publicPaymentInfo.user_id
        delete publicPaymentInfo.toss_billing_key
        delete publicPaymentInfo.createdAt


        return res.status(201).json({
            data: publicPaymentInfo,
            message: "성공적으로 결제수단이 등록되었습니다."
        })

    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }

}


export const billingAuthFail = (req: Request, res: Response) => {
    return res.status(500).json({
        message: "결제수단 등록중 문제가 발생했습니다."
    })
}