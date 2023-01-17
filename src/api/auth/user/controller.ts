import axios from "axios";
import * as qs from "qs";
import { Request, Response } from "express"
import dotenv from "dotenv"
dotenv.config()

import Agent from "../../models/Agent"
import User from "../../models/User"
import Payment from "../../models/Payment"
import { Optional } from "sequelize";

const Errors = {
    getProfileError: new Error("failed get profile from api server")
}

//**specific exception cases
//--exception case1. store가 sin을 생성하고 입력해 화성화시킨 상태가 아닐때 그 store_id를 지정해서 agent를 요청할 수 없다.
//--exception case2. user A가 agent를 사용하고 있을 때, user B가 agent를 요청한다면, 거부해야한다. 그 사람이 kiosk device앞에 있다면 충분히 로그아웃 할 수 있을 것.
export async function requestAgent(req: Request, res: Response) {
    const targetStoreId = req.query.store_id

    const targetAgent = await Agent.findOne({
        where: {
            store_id: targetStoreId,
        }
    })

    //exception case1.
    if (targetAgent == undefined) {
        res.status(404).json({
            code: 404,
            message: "부스가 활성화된 상태가 아닙니다."
        })

        return
    }


    //exception case2.
    if (targetAgent.get("user_id")) {
        res.status(404).json({
            code: 404,
            message: "다른 사용자가 사용중인 부스입니다."
        })

        return
    }

    targetAgent.update({
        user_id: req.session.user.id
    })
        .then(() => {
            res.status(200).json({
                code: 200,
                mssage: "권한 위임요청완료",

            })
        })
        .catch(err => {
            res.status(500).json({
                code: 500,
                message: "알 수 없는 에러가 발생했습니다."
            })
        })
}

export async function renderSignin(req: Request, res: Response) {
    res.render("user/signin")
}
export async function signout(req: Request, res: Response) {
    req.session.destroy((err) => {
        if (err) {
            //ignore
        }
    })

    res.redirect("/auth/signin/user")
}

export async function oauthSignin(req: Request, res: Response) {
    const provider = req.params.provider

    //redirect client to conscent screen
    res.redirect(getAuthCodeURL(provider))
}

export async function oauthSinginCallback(req: Request, res: Response) {
    const { code } = req.query
    const provider = req.params.provider


    //oauth로 사용하지 않는 provider를 parameter로 넘긴 경우
    if (Object.keys(api_info).includes(provider) == false) {
        res.status(400).json({
            code: 400,
            message: "지원하지 않는 서비스입니다."
        })

        return
    }

    //if code not sended as parameter
    // will be one of the cases below
    // 1. client try to access /auth/google/callback directly withour pass through conscent screen
    // 2. user failed authentication from oauth server  
    if (code == undefined) {
        res.status(401).json({
            code: 401,
            message: "해당 서비스 인증에 실패했습니다."
        })

        return
    }

    //get user profile from oauth server
    let profile = await getUserProfile({ code: code.toString(), provider })

    //잘못된 접근이면 이전 과정에서 error가 발생하기 떄문에 id로 체크해도 문제가 되지 않는다.
    const existUser = await User.findOne({
        where: {
            id: profile.id
        }
    })

    if (existUser) {
        req.session.user = existUser
        res.redirect("/user")
    } else {
        User.create({
            id: profile.id,
            username: profile.username,
            pfp: profile.pfp,
        })
            .then((created_user) => {
                req.session.user = created_user
                res.redirect("/user")
            })
            .catch(err => {
                res.status(400).json({
                    code: 400,
                    message: "oauth 인증에 실패했습니다."
                })
            })
    }
}



interface API_INFO {
    [key: provider]: any
}

const api_info: API_INFO = {
    "google": {
        app_key: process.env.GOOGLE_APP_KEY,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,

        auth_code_url: "https://accounts.google.com/o/oauth2/v2/auth",
        token_url: "https://oauth2.googleapis.com/token",
        profile_url: "https://people.googleapis.com/v1/people/me",
        getUserProfile: getGoogleUserProfile,

        // id, username, pfp in userinfo.profile 
        // email in userinfo.email
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",

        redirect_url: "https://localhost:8000/auth/client/google/callback",
    },
    "kakao": {
        // app_key: undefined, //kakao api는 app key를 요구하지 않음
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,

        auth_code_url: "https://kauth.kakao.com/oauth/authorize",
        token_url: "https://kauth.kakao.com/oauth/token",
        profile_url: "https://kapi.kakao.com/v2/user/me",
        getUserProfile: getKakaoUserProfile,

        // scope: undefined, //kakao는 default로 id, username, email, pfp를 모두 허용

        //Authorization code를 전송받을 url, token은 redirect_url로 명시만
        redirect_url: `http://${process.env.HOST}/auth/user/signin/kakao/callback`,
    }
}


function getGoogleUserProfile(accessToken: string) {
    return new Promise<any>((resolve, reject) => {
        axios(api_info["google"].profile_url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            params: {
                key: api_info['google'].app_key,
                personFields: "names,photos,emailAddresses"
            }
        })
            .then((resp) => {
                resolve({
                    id: resp.data.names[0].metadata.source.id,
                    username: resp.data.names[0].displayName,
                    email: resp.data.emailAddresses[0].value,
                    pfp: resp.data.photos[0].url
                })
            })
            .catch(err => {
                reject(err)
            })
    })
}

function getKakaoUserProfile(accessToken: string) {
    return new Promise((resolve, reject) => {
        axios(api_info["kakao"].profile_url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then((resp) => {
                resolve({
                    id: resp.data.id,
                    username: resp.data.properties.nickname,
                    email: resp.data.kakao_account.email,
                    pfp: resp.data.properties.profile_image,
                })
            })
            .catch(err => {
                reject(err)
            })
    })
}


function generateURL(url: string, params?: Object): string {
    let result: string = "";

    //host
    if (url[url.length - 1] == '/') {
        url = url.substring(0, url.length - 1)
    }

    result += url

    result += "?"

    result += qs.stringify(params)

    return result
}

//other string will be raise error
type provider = "google" | "kakao" | string

type authorization_code = {
    provider: provider,
    code: string,
}


//get access_token, refresh_token from oauth server with authorization code
function getTokens(auth_code: authorization_code): Promise<any> {
    const provider = auth_code.provider

    return axios(api_info[provider].token_url, {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded:charset=utf-8"
        },
        params: {
            code: auth_code.code,
            client_id: api_info[provider].client_id,
            client_secret: api_info[provider].client_secret,
            redirect_uri: api_info[provider].redirect_url,
            grant_type: "authorization_code",
        }
    })
}


export function getAuthCodeURL(provider: provider): string {
    return generateURL(api_info[provider].auth_code_url, {
        client_id: api_info[provider].client_id,
        redirect_uri: api_info[provider].redirect_url,
        response_type: "code",
        scope: api_info[provider].scope
    })
}

//get user information from oauth api server with authorization code
export function getUserProfile(auth_code: authorization_code): Promise<Optional<any, string>> {
    return new Promise((resolve, reject) => {
        getTokens(auth_code)
            .then((token_resp) => {
                const accessToken = token_resp.data.access_token

                return api_info[auth_code.provider].getUserProfile(accessToken)
            })
            .then((profile) => {
                profile.auth_code = auth_code.code
                resolve(profile)
            })
            .catch(err => {
                reject(err)
            })
    })
}


