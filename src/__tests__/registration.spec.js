const Faker = require('faker')
const Kopter = require('../Kopter')
const Request = require('supertest')
const Mongoose = require('mongoose')
const { Container } = require('typedi')
const { USER_MODEL } = require('../utils/constants')

process.env.JWT_SECRET = 'shhh'
process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'

const defaultKopterConfig = {
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
    await Container.get(USER_MODEL).deleteMany({})
    await Mongoose.connection.close()
})

const generateFakeUser = () => ({
    email: Faker.internet.email(),
    password: Faker.internet.password(),
    emailConfirmCode: Faker.random.word()
})

test('/auth/register can register a new user to the database', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

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
    const app = await new Kopter(defaultKopterConfig).init()

    const user = generateFakeUser()
    await Container.get(USER_MODEL).create(user)

    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: user.email,
            password: user.password
        })

    expect(response.body).toMatchSnapshot()
})

test('/auth/register validates email and password correctly', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const response = await Request(app)
        .post('/auth/register')
        .send({})

    expect(response.body).toMatchSnapshot()
})
