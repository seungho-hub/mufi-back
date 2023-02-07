import cache from "node-cache"

export type VerifyInfo = {
    otp: string,
    verified: boolean,
    count: number,
}

let OtpCache:cache

export function initializeCache():void{
    if(!OtpCache){
        OtpCache = new cache({
            stdTTL : 60 * 3,
            checkperiod : 60 * 5
        });
    }
}

initializeCache()

export default OtpCache