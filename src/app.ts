import express from "express"
//import routers
import { menu } from "./api/v1/routes/menu"
import { authBUser } from "./api/auth/buser/route"
import { authUser } from "./api/auth/user/route"
import { home } from "./api/v1/routes/home"


import path from "path"
import session from "express-session"
import dbConfig from "./api/config/DBConfig"
import createSessionConfig from "./api/config/SessionConfig"
const MySQLStore = require("express-mysql-session")(session)
import { bUserAuthenticated } from "./api/auth/bUser/middleware"
import fileupload from "express-fileupload"

export const app = express()

//set port number
app.set("port", process.env.PORT || 80)

//set view engine 'ejs'
app.set("view engine", "ejs");

//set views folder for view engine
app.set("views", path.join(__dirname, "../views", "templates"))

//static serving
app.use(express.static(path.join(__dirname, "../views", "statics")))
app.use(express.static(path.join(process.env.PWD, "media")))

//enable body parser
app.use(express.urlencoded({ extended: true }))

app.use(fileupload({}))
const sessionStore = new MySQLStore(dbConfig)

app.use(session(createSessionConfig(sessionStore)))

//except auth router from session check middleware
app.use("/buser", bUserAuthenticated.unless({
    path: [/\/auth\/*/],
}))

app.use("/", home)
app.use("/api/v1/menu", menu)
app.use("/auth/user", authUser)
app.use("/auth/buser", authBUser)




