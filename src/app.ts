import express from "express"
import fileupload from "express-fileupload"
import morgan from "morgan"
import path from "path"

import dbConfig from "./api/config/DBConfig"
import createSessionConfig from "./api/config/SessionConfig"
import session from "express-session"
const MySQLStore = require("express-mysql-session")(session)
import { accessLoggerConfig, errorLoggerConfig, customTokenConfig } from "./api/config/Logger"

export const app = express()

morgan.token("session", customTokenConfig)

app.use(morgan(
    accessLoggerConfig.format,
    accessLoggerConfig.options,
));

app.use(morgan(
    errorLoggerConfig.format,
    errorLoggerConfig.options
))


//set port number
app.set("port", process.env.PORT || 80)

//set view engine 'ejs'
app.set("view engine", "ejs");

//set views folder for view engine
app.set("views", path.join(process.cwd(), "views", "templates"))

//static serving
app.use(express.static(path.join(process.cwd(), "views", "statics")))
app.use(express.static(path.join(process.cwd(), "media")))

//enable body parser
app.use(express.urlencoded({ extended: true }))

app.use(fileupload({}))

const sessionStore = new MySQLStore(dbConfig)
app.use(session(createSessionConfig(sessionStore)))


//**************routing**************/

//import buser router
import { bUserAuthRouter } from "./api/auth/buser/route"

import { menuRouter } from "./api/buser/routes/menu"
import { buserRouter } from "./api/buser/routes/buser"
import { storeRouter } from "./api/buser/routes/store"
import { sinRouter } from "./api/buser/routes/sin"
import { buserOrderRouter } from './api/buser/routes/order';

import { bUserPageRouter } from "./buser/router"

import { bUserAuthMiddleware } from "./api/auth/buser/middleware"

//import user router
import { userAuthRouter } from "./api/auth/user/route"
import { uinRouter } from "./api/user/routes/uin"
import { userPaymentRouter } from "./api/user/routes/payment"
import { tossRouter } from "./api/user/routes/toss"

import { userPageRouter } from "./user/router"

import { userAuthMiddleware } from "./api/auth/user/middleware"

//import kiosk router
import { kioskAuthorityRouter } from "./api/auth/kiosk/route"
import { orderRouter } from "./api/kiosk/routes/order"
import { kioskMenuRouter } from "./api/kiosk/routes/menu"
import { kioskPaymentRouter } from "./api/kiosk/routes/payment"

import { kioskPageRouter } from "./kiosk/router"

import { checkStoreAuthority, checkUserAuthority } from "./api/auth/kiosk/middleware"

//--------------------------------------user
//middleware
app.use("/user/", userAuthMiddleware)
app.use("/api/user", userAuthMiddleware)

//authentication
app.use("/auth/user", userAuthRouter)

//api routing
app.use("/api/user/uin", uinRouter)
app.use("/api/user/payments", userPaymentRouter)
app.use("/api/user/payments/toss", tossRouter)

//page routing
app.use("/user", userPageRouter)


//--------------------------------------buser
//middleware
app.use("/buser", bUserAuthMiddleware)
app.use("/api/buser", bUserAuthMiddleware)

//authentication
app.use("/auth/buser", bUserAuthRouter)

//api routing
app.use("/api/buser/", buserRouter)
app.use("/api/buser/stores", storeRouter)
app.use("/api/buser/stores/:storeId/menus", menuRouter)
app.use("/api/buser/stores/:storeId/sin", sinRouter)
app.use("/api/buser/stores/:storeId/orders", buserOrderRouter)

//page routing
app.use("/buser", bUserPageRouter)


//--------------------------------------kiosk
//middleware
app.use("/api/kiosk", checkStoreAuthority, checkUserAuthority)
app.use("/kiosk", checkStoreAuthority, checkUserAuthority)

//authentication
app.use("/auth/kiosk", kioskAuthorityRouter)

//api routing
app.use("/api/kiosk/menus", kioskMenuRouter)
app.use("/api/kiosk/orders", orderRouter)
app.use("/api/kiosk/payments", kioskPaymentRouter)

//page routing
app.use("/kiosk", kioskPageRouter)




