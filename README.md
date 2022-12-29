# Mufi

![](https://elastic-ski-802.notion.site/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc2b5a3ff-6c92-4222-905e-cc0412cb20f7%2F%EB%AC%B4%ED%94%BC_%EB%A1%9C%EA%B3%A0.png?table=block&id=dc1d1d3b-27db-4dd2-8389-c0b272955973&spaceId=290827d9-99cd-42c4-8c2f-640909027e0e&width=250&userId=&cache=v2?size=20)

Mufi kiosk를 위한 webservice입니다.


### 0. create dotenv file
    
.env.example 파일을 참고해 .env 파일을 생성해주세요
    
    
### 1. install dependencies

의존성 모듈을 설치합니다.

    yarn install


### 2. compile typescript to javascript

    yarn run compile
    
    
### 3. initialize

#### database의 table을 생성합니다.
    
    yarn run init



## run server


### run server in development mode

    yarn run dev



### run server in development mode and watch 
re-run server  whenever source code change detected

    yarn run watch

# Author

- [seungho-hub](https://github.com/seungho-hub)
