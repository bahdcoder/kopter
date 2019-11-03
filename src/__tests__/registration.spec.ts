import Faker from 'faker'
import Express from 'express'
import Container from 'typedi'
import Request from 'supertest'
import Mongoose from 'mongoose'
import { USER_MODEL } from '../utils/constants'
import { Kopter, KopterConfig } from '../Kopter'

process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'

const defaultKopterConfig: KopterConfig = {
    pino: false,
    mail: {
        connection: 'memory',
        views: '/src/mails',
        viewEngine: 'handlebars',
        memory: {
            driver: 'memory'
        }
    }
}

afterAll(async () => {
    await Mongoose.connection.close()
})

const generateFakeUser = () => ({
    email: Faker.internet.email(),
    password: Faker.internet.password(),
    emailConfirmCode: Faker.random.word()
})

test('/auth/register can register a new user to the database', async () => {
    const app = await new Kopter(Express(), defaultKopterConfig).init()

    const user = generateFakeUser()
    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: user.email,
            password: user.password
        })

    expect(response.body.code).toBe('created')
    expect(Object.keys(response.body.data)).toMatchSnapshot()
})

test('/auth/register does not allow duplicate emails', async () => {
    const app = await new Kopter(Express(), defaultKopterConfig).init()

    const user = generateFakeUser()
    await (Container.get(USER_MODEL) as any).create(user)

    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: user.email,
            password: user.password
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
