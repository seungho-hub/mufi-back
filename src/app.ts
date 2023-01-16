import express from "express"
import fileupload from "express-fileupload"
import morgan from "morgan"
import { accessLoggerConfig, errorLoggerConfig, customTokenConfig } from "./api/config/Logger"
import fs from "fs"
//import routers

//user router
import { authUser } from "./api/auth/user/route"

//buser router
import { menuRouter } from "./api/buser/routes/menu"
import { buserRouter } from "./api/buser/routes/buser"
import { authBUser } from "./api/auth/buser/route"
import { bUserRouter } from "./buser/router"
import { storeRouter } from "./api/buser/routes/store"
import { storeOrderRouter } from "./api/buser/routes/order"
import { kioskRouter } from "./kiosk/router"
import { kioskAuthRouter } from "./api/auth/kiosk/route"
import { orderRouter } from "./api/kiosk/routes/order"
import { sinRouter } from "./api/buser/routes/sin"
import { userHomeRouter } from "./user/router"
import { uinRouter } from "./api/user/routes/uin"
import { PaymentRouter } from "./api/user/routes/Payment"

import path from "path"
import session from "express-session"
import dbConfig from "./api/config/DBConfig"
import createSessionConfig from "./api/config/SessionConfig"
const MySQLStore = require("express-mysql-session")(session)
import { bUserAuthenticated } from "./api/auth/buser/middleware"
import { userAuthenticated } from "./api/auth/user/middleware"
import { checkGotStoreAuthorization, checkGotUserAuthorization } from "./api/auth/kiosk/middleware"

export const app = express()

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

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
console.log(process.cwd())
app.use(express.static(path.join(process.cwd(), "media")))

//enable body parser
app.use(express.urlencoded({ extended: true }))

app.use(fileupload({}))
const sessionStore = new MySQLStore(dbConfig)

app.use(session(createSessionConfig(sessionStore)))


//--------------------------------------
//user routing
app.use("/user/", userAuthenticated)
//for api
app.use("/api/user", userAuthenticated)

app.use("/auth/user", authUser)
app.use("/user", userHomeRouter)
app.use("/api/user/uin", uinRouter)
app.use("/api/user/payment", PaymentRouter)


//--------------------------------------
//buser routing

//for home
app.use("/buser", bUserAuthenticated)
//for api
app.use("/api/buser", bUserAuthenticated)
app.use("/auth/buser", authBUser)
app.use("/buser", bUserRouter)

app.use("/api/buser/", buserRouter)
app.use("/api/buser/menu", menuRouter)
app.use("/api/buser/store", storeRouter)
app.use("/api/buser/sin", sinRouter)
app.use("/api/buser/order", storeOrderRouter)

//--------------------------------------
app.use("/api/kiosk", checkGotStoreAuthorization)
app.use("/api/kiosk", checkGotUserAuthorization)
app.use("/api/kiosk/order", orderRouter)

app.use("/kiosk", checkGotStoreAuthorization)
app.use("/kiosk", checkGotUserAuthorization)
app.use("/kiosk", kioskRouter)

app.use("/auth/kiosk", kioskAuthRouter)




