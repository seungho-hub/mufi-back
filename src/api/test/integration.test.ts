import chaiHttp from "chai-http"
import chai from "chai"
const expect = chai.expect
import "mocha"
import * as dotenv from "dotenv"
dotenv.config()
import server from '../../server'
import fs from "fs"
import { RowDataPacket } from "mysql2/typings/mysql"

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

const { testUser, testStore, updateStore, testMenu } = JSON.parse(testRawData.toString())

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

        before(() => {
            //before start test, delete buser also columns related buser
            //test 시작 전에 지우는 이유는, test 후에 test data로 
            connection.query(`delete from busers where username="${testUser.username}"`, (err) => {
                if (err) {
                    throw err
                }
            })
        })

        //test_buser로 회원가입한다.
        step("1. signup", (done) => {
            buserAgent
                .post("/auth/buser/signup")
                .type("form")
                .send({
                    username: testUser.username,
                    email: testUser.email,
                    password1: testUser.password,
                    password2: testUser.password
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res).to.have.status(201)
                    done()
                })
        })

        //test_buser로 로그인한다.
        step("2. signin", (done) => {
            buserAgent
                .post("/auth/buser/signin")
                .type("form")
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res).to.have.status(200)
                    expect("Location", "/buser")
                    done()
                })
        })

        //access home with test_buser
        //check authentication after signin
        step("3. access home", (done) => {
            buserAgent
                .get("/buser/home")
                .end((err, res) => {
                    expect(err).to.be.null
                    //authenticationn에 성공해 redirect되지 않음
                    expect(res).not.to.redirect
                    expect(res).to.have.status(200)

                    done()
                })
        })

        //we do not know id of buser so,
        //test get buser and set save buser id
        step("4. get self", (done) => {
            buserAgent
                .get("/api/buser/self")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res).not.to.redirect
                    expect(res).to.have.status(200)

                    //res.body.data will be buser object
                    testUser.id = res.body.data.id
                    done()
                })
        })

        //Create store
        step("5. create store", (done) => {
            //1. 먼저 mufi 측에서 store를 id, code, buser_id만 채워서 생성한 후 code를 buser실제 사용자에게 알려준다.
            const registerStoreQ = `INSERT INTO stores(id, code, buser_id) VALUES('${testStore.id}', '${testStore.code}', '${testUser.id}')`

            connection.query(registerStoreQ, (err) => {
                if (err) {
                    done(err)
                }

                return
            })

            //request create store with code which provided from Mufi
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
                    //requestr중 error가 없고
                    expect(err).to.be.null
                    //middleware에 걸려 redirect되지 않았으며
                    expect("Location", "/api/buser/stores")
                    //200의 status code를 받아 성공적으로 매장 생성을 확인
                    expect(res).to.have.status(201)

                    done()
                })
        })

        //Read store
        step("6. get store", (done) => {
            buserAgent
                .get(`/api/buser/stores/${testStore.id}`)
                .end((err, res) => {
                    expect(err).to.be.null
                    expect("Location", `/api/buser/stores/${testStore.id}`)
                    expect(res).to.have.status(200)
                    done()
                })

        })

        //Read stores
        step("7. gets store", (done) => {
            buserAgent
                .get("/api/buser/stores")
                .end((err, res) => {
                    expect(err).to.be.null
                    expect("Location", "/api/buser/stores")
                    expect(res).to.have.status(200)

                    done()
                })
        })

        //Update store
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
                    expect(res).to.have.status(201)
                    testMenu.id = res.body.data.id

                    done()
                })
        })

        //we do not know id of created menu
        //get menu and save id of created menu just before
        step("10. get menu", (done) => {
            buserAgent
                .get(`/api/buser/stores/${testStore.id}/menus/${testMenu.id}`)
                .end((err, res) => {
                    expect(err).to.be.null
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
                    expect("Location", "/api/buser/sin")
                    expect(res).to.have.status(200)
                    sin = res.body.data
                    done()
                })
        })
    })

    describe("Kiosk", () => {
        step("1.input sin", (done) => {
            kioskAgent
                .post("/auth/kiosk/agent-store")
                .type("form")
                .send({
                    sin
                })
                .end((err, res) => {
                    expect(err).to.be.null
                    expect("Location", "/auth/kiosk/agent-user")
                    expect(res).to.have.status(200)
                    done()
                })
        })
    })
}





