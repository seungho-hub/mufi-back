import chaiHttp from "chai-http"
import chai from "chai"
const expect = chai.expect
import "mocha"
import * as dotenv from "dotenv"
dotenv.config()
import server from '../../server'
import fs from "fs"

chai.use(chaiHttp)

import mysql from "mysql2"
import { step } from "mocha-steps"

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PW,
})

const testRawData = fs.readFileSync(`src/api/test/data.json`)

const { testBuser, testStore, updateStore, testMenu, testUser } = JSON.parse(testRawData.toString())

const buserAgent: ChaiHttp.Agent = chai.request.agent(server);
const kioskAgent: ChaiHttp.Agent = chai.request.agent(server);
const userAgent: ChaiHttp.Agent = chai.request.agent(server);
/**
 * mufi project의 예외사항은 거의 없다.
 * 때문에 specific step을 통과하는 test를 작성한다.
 */
if (server.listening) {
    let sin: String;
    let uin: String;

    describe("Buser", () => {
        step("1. signup", (done) => {
            buserAgent
                .post("/auth/buser/signup")
                .type("form")
                .send({
                    username: testBuser.username,
                    tel: testBuser.tel,
                    password1: testBuser.password,
                    password2: testBuser.password
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res).to.have.status(201)
                    done()
                })
        })

        step("2. signin", (done) => {
            buserAgent
                .post("/auth/buser/signin")
                .type("form")
                .send({
                    username: testBuser.username,
                    password: testBuser.password
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res).to.have.status(200)
                    expect("Location", "/buser")
                    done()
                })
        })

        step("3. access home", (done) => {
            buserAgent
                .get("/buser/home")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(200)
                    done()
                })
        })

        step("4. get self", (done) => {
            buserAgent
                .get("/api/buser/self")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(200)

                    testBuser.id = res.body.data.id
                    done()
                })
        })

        step("5. create store", (done) => {
            const registerStoreQ = `INSERT INTO stores(id, code, buser_id) VALUES('${testStore.id}', '${testStore.code}', '${testBuser.id}')`

            connection.query(registerStoreQ, (err) => {
                if (err) {
                    done(err)
                }

                return
            })

            buserAgent
                .post("/api/buser/stores")
                .type("form")
                .send({
                    code: testStore.code,
                    name: testStore.name,
                    description: testStore.description,
                    address: testStore.address,
                    zip_code: testStore.zip_code,
                    detail_address: testStore.detail_address,
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect("Location", "/api/buser/stores")
                    expect(res).to.have.status(201)

                    done()
                })
        })

        step("6. get store", (done) => {
            buserAgent
                .get(`/api/buser/stores/${testStore.id}`)
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect("Location", `/api/buser/stores/${testStore.id}`)
                    expect(res).to.have.status(200)
                    done()
                })

        })

        step("7. gets store", (done) => {
            buserAgent
                .get("/api/buser/stores")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect("Location", "/api/buser/stores")
                    expect(res).to.have.status(200)

                    done()
                })
        })

        step("8. update store", (done) => {
            buserAgent
                .put(`/api/buser/stores/${testStore.id}`)
                .type("form")
                .send({
                    name: updateStore.name,
                    description: updateStore.description,
                    zip_code: updateStore.zip_code,
                    detail_address: updateStore.detail_address
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect("Location", "/api/buser/stores")
                    expect(res).to.have.status(200)
                    done()
                })
        })

        step("9. create menu", (done) => {
            buserAgent
                .post(`/api/buser/stores/${testStore.id}/menus`)
                .type("form")
                .field({
                    label: testMenu.label,
                    price: testMenu.price,
                    description: testMenu.description,
                })
                .attach("image", fs.readFileSync(testMenu.image), "image.png")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect("Location", "/api/buser/stores")
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(201)
                    testMenu.id = res.body.data.id

                    done()
                })
        })

        step("10. get menu", (done) => {
            buserAgent
                .get(`/api/buser/stores/${testStore.id}/menus/${testMenu.id}`)
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect("Location", "/api/buser/stores")
                    expect(res).to.have.status(200)

                    done()
                })
        })

        step("11. get all of menu of store", (done) => {
            buserAgent
                .get(`/api/buser/stores/${testStore.id}/menus/${testMenu.id}`)
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect("Location", "/api/buser/stores")
                    expect(res).to.have.status(200)

                    done()
                })
        })

        step("12. update menu", (done) => {
            done()
        })

        step("13. generate store identifier number", (done) => {
            buserAgent
                .post(`/api/buser/stores/${testStore.id}/sin`)
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect("Location", "/api/buser/sin")
                    expect(res).to.have.status(201)
                    sin = res.body.data.sin
                    done()
                })
        })
    })

    describe("User", () => {
        step("1. signup", (done) => {
            userAgent
                .post("/auth/user/signup")
                .type("form")
                .send({
                    username: testUser.username,
                    tel: testUser.tel,
                    password1: testUser.password1,
                    password2: testUser.password2,
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(201)
                    done()
                })
        })

        step("2. signin", (done) => {
            userAgent
                .post("/auth/user/signin")
                .type("form")
                .send({
                    username: testUser.username,
                    password: testUser.password1
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(200)
                    expect("Location", "/buser")
                    done()
                })
        })

        step("3. access home", (done) => {
            userAgent
                .get("/user")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(200)
                    expect("Location", "/buser")
                    done()
                })
        })
    })

    describe("Kiosk", () => {
        step("1.grant store Authority", (done) => {
            kioskAgent
                .post("/auth/kiosk/agent-store")
                .type("form")
                .send({
                    sin
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect("Location", "/auth/kiosk/agent-user")
                    expect(res).to.have.status(200)
                    done()
                })
        })

        step("2.[User] grant user Authority", (done) => {
            userAgent
                .put("/auth/user/agent")
                .query({ store_id: testStore.id })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(200)
                    done()
                })
        })

        step("3.grant user Authority", (done) => {
            kioskAgent
                .post("/auth/kiosk/agent-user")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(200)
                    done()
                })
        })

        step("4. access home", (done) => [
            kioskAgent
                .get("/kiosk")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(200)
                    done()
                })
        ])

        step("5. delete user authority", (done) => {
            kioskAgent
                .delete("/auth/kiosk/agent-user")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res).to.have.status(200)
                    expect(res.redirects).to.be.empty
                    expect("Location", "/auth/kiosk/agent-user")
                    done()
                })
        })

        step("6. delete store authority", (done) => {
            kioskAgent
                .delete("/auth/kiosk/agent-store")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res).to.have.status(200)
                    expect(res.redirects).to.be.empty
                    expect("Location", "/auth/kiosk/agent-store")
                    done()
                })
        })
    })

    describe("delete accounts", () => {
        step("1. delete buser", (done) => {
            buserAgent
                .delete("/auth/buser")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(204)
                    expect("Location", "/auth/buser")
                    done()
                })
        })

        step("2. delete user", (done) => {
            userAgent
                .delete("/auth/user")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.redirects).to.be.empty
                    expect(res).to.have.status(204)
                    expect("Location", "/auth/user")
                    done()
                })
        })
    })

}





