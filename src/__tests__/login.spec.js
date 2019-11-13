const Faker = require('faker')
const Bcrypt = require('bcryptjs')
const Kopter = require('../Kopter')
const Request = require('supertest')
const Mongoose = require('mongoose')
const { Container } = require('typedi')
const { USER_MODEL } = require('../utils/constants')
const clearRegisteredModels = require('./test-utils/clear-registered-models')

process.env.JWT_SECRET = 'shhh'
process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'

const defaultKopterConfig = {
    pino: false
}

afterAll(async () => {
    await Container.get(USER_MODEL).deleteMany({})
    await Mongoose.connection.close()
})

beforeEach(clearRegisteredModels)

const generateFakeUser = () => ({
    email: Faker.internet.email(),
    emailConfirmCode: Faker.random.word(),
    password: Bcrypt.hashSync('password')
})

test('/auth/login can login a user with the right credentials', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const user = generateFakeUser()

    await Container.get(USER_MODEL).create(user)

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
    const app = await new Kopter(defaultKopterConfig).init()

    const user = generateFakeUser()

    await Container.get(USER_MODEL).create(user)

    const response = await Request(app)
        .post('/auth/login')
        .send({
            email: user.email
        })

    expect(response.body.code).toBe('badRequest')
    expect(response.body).toMatchSnapshot()
})

test('/auth/login does not allow login with wrong email', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const user = generateFakeUser()

    await Container.get(USER_MODEL).create(user)

    const response = await Request(app)
        .post('/auth/login')
        .send({
            email: 'email_does_not@exist.com',
            password: 'password'
        })

    expect(response.body.code).toBe('badRequest')
    expect(response.body).toMatchSnapshot()
})
