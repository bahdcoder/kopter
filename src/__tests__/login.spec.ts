import Faker from 'faker'
import Express from 'express'
import Bcrypt from 'bcryptjs'
import Request from 'supertest'
import Mongoose from 'mongoose'
import Container from 'typedi'
import { USER_MODEL } from '../utils/constants'
import { Kopter, KopterConfig } from '../Kopter'

process.env.JWT_SECRET = 'shhh'
process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'

const defaultKopterConfig: KopterConfig = {
    pino: false
}

afterAll(async () => {
    await Mongoose.connection.close()
})

const generateFakeUser = () => ({
    email: Faker.internet.email(),
    emailConfirmCode: Faker.random.word(),
    password: Bcrypt.hashSync('password')
})

test('/auth/login can login a user with the right credentials', async () => {
    const app = await new Kopter(Express(), defaultKopterConfig).init()

    const user = generateFakeUser()

    await (Container.get(USER_MODEL) as any).create(user)

    const response = await Request(app)
        .post('/auth/login')
        .send({
            email: user.email,
            password: 'password'
        })

    expect(response.body.code).toBe('ok')
    expect(Object.keys(response.body.data)).toMatchSnapshot()
})

test('/auth/login does not allow user login with wrong password', async () => {
    const app = await new Kopter(Express(), defaultKopterConfig).init()

    const user = generateFakeUser()

    await (Container.get(USER_MODEL) as any).create(user)

    const response = await Request(app)
        .post('/auth/login')
        .send({
            email: user.email
        })

    expect(response.body.code).toBe('badRequest')
    expect(response.body).toMatchSnapshot()
})

test('/auth/login does not allow login with wrong email', async () => {
    const app = await new Kopter(Express(), defaultKopterConfig).init()

    const user = generateFakeUser()

    await (Container.get(USER_MODEL) as any).create(user)

    const response = await Request(app)
        .post('/auth/login')
        .send({
            email: 'email_does_not@exist.com',
            password: 'password'
        })

    expect(response.body.code).toBe('badRequest')
    expect(response.body).toMatchSnapshot()
})
