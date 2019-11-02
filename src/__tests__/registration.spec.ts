import Express from 'express'
import Request from 'supertest'
import Mongoose from 'mongoose'
import { Kopter, KopterConfig } from '../Kopter'
import Container from 'typedi'
import { USER_MODEL } from '../utils/constants'

process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'

const defaultKopterConfig: KopterConfig = {
    pino: false
}

afterAll(async () => {
    await Mongoose.connection.close()
})

const resetUsersCollection = async () => {
    await (Container.get(USER_MODEL) as any).remove({})
}

const TEST_EMAIL = 'TEST@EMAIL.COM'
const TEST_PASSWORD = 'TEST_PASSWORD'
const TEST_EMAIL_CONFIRM_CODE = 'TEST_EMAIL_CONFIRM_CODE'

test('/auth/register can register a new user to the database', async () => {
    const app = await new Kopter(Express(), defaultKopterConfig).init()

    await resetUsersCollection()

    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        })

    expect(response.body.code).toBe('created')
    expect(Object.keys(response.body.data)).toMatchSnapshot()
})

test('/auth/register does not allow duplicate emails', async () => {
    const app = await new Kopter(Express(), defaultKopterConfig).init()

    await resetUsersCollection()

    await (Container.get(USER_MODEL) as any).create({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        emailConfirmCode: TEST_EMAIL_CONFIRM_CODE
    })

    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        })

    expect(response.body).toMatchSnapshot()
})

test('/auth/register validates email and password correctly', async () => {
    const app = await new Kopter(Express(), defaultKopterConfig).init()

    const response = await Request(app)
        .post('/auth/register')
        .send({})

    expect(response.body).toMatchSnapshot()
})
