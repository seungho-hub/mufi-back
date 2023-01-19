import { SessionOptions, Store } from "express-session"

//
function createSessionConfig(sessionStore: Store): SessionOptions {
    return {
        name: "mufi.sid",
        secret: process.env.APP_SECRET,
        store: sessionStore,
        //false : prevent useless save operation excuting when db query request incoming
        //true : deprecated
        resave: false,
        //false : prevent stacking empty session objects
        //true : deprecated
        saveUninitialized: false,
    }
}

export default createSessionConfig