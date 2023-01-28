import axios from "axios";
import * as qs from "qs";
import { Request, Response } from "express"
import dotenv from "dotenv"
dotenv.config()

import Agent from "../../../models/Agent"
import User from "../../../models/User"
import Payment from "../../../models/Payment"
import { Optional } from "sequelize";


export async function renderSignin(req: Request, res: Response) {
    res.render("user/signin")
}
export async function signout(req: Request, res: Response) {
    req.session.destroy((err) => {
        if (err) {
            //ignore
        }
    })

    res.status(200).json({
        message: "성공적으로 로그아웃 되었습니다."
    })
}

export async function oauthSignin(req: Request, res: Response) {
    const provider = req.params.provider

    //redirect client to conscent screen
    res.redirect(getAuthCodeURL(provider))
}

export async function oauthSinginCallback(req: Request, res: Response) {
    const { code } = req.query
    const provider = req.params.provider

    try {
        //oauth로 사용하지 않는 provider를 parameter로 넘긴 경우
        if (Object.keys(api_info).includes(provider) == false) {
            return res.status(400).json({
                code: 400,
                message: "지원하지 않는 서비스입니다."
            })
        }

        //if code not sended as parameter
        // will be one of the cases below
        // 1. client try to access /auth/google/callback directly withour pass through conscent screen
        // 2. user failed authentication from oauth server  
        if (!code) {
            return res.status(401).json({
                code: 401,
                message: "해당 서비스 인증에 실패했습니다."
            })
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
            return res.redirect("/user")
        } else {
            const created_user = await User.create({
                id: profile.id,
                username: profile.username,
                pfp: profile.pfp,
                email: profile.email,
                //sequelize에서 field가 null인 경우 validation을 ignore하는 기능을 업데이트하지 않기로 결정됨.
                //validation마다 pass를 걸어 지저분한 코드를 만드는 것보다 password를 입력해주는 편이 낫다고 판단
                //issue 9143 : https://github.com/sequelize/sequelize/issues/9143
                //!!대신 local signin에서 provider가 'local'인 경우만 허용해야한다. 이를 무시하면 provider가 가지고있던 user의 email과 이 password만으로 signin할 수 있게된다.
                password: "SnsSignin1234",
                provider
            })


            req.session.user = created_user
            return res.redirect("/user")
        }
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
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


