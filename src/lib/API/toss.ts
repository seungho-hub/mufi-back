import axios from "axios"
import { v4 } from "uuid"

type OrderInfo = {
    amount : number,
    billingKey : string,
    customerKey : string,
    orderName : string,
}

const tossAPI = {
    order : function(info:OrderInfo){
        return axios({
            method : "POST",
            url : `https://api.tosspayments.com/v1/billing/${info.billingKey}`,
            headers : {
                "Authorization": `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ":", "utf-8").toString("base64")}`,
                "Content-type": "application/json"
            },
            data : {
                orderId : v4(),
                ...info
            }
        })
    }
}

export default tossAPI