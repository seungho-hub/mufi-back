import qs from "qs"
import axios from "axios"
import {AxiosPromise} from "axios"

const aligoAPI = {
    urls: {
        send: "https://apis.aligo.in/send/"
    },
    send : function(msg:string, tel:string):AxiosPromise<any>{
        return axios({
            method : "POST",
            url : this.urls.send,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data : qs.stringify({
                    key: process.env.ALIGO_API_KEY,
                    user_id: process.env.ALIGO_USER_ID,
                    sender: process.env.ALIGO_SENDER_PHONE_NUMBER,
                    receiver: "010" + tel,
                    msg,
                    testmode_yn : "Y"
            })
        })
    }
}

export default aligoAPI