const Faker = require('faker')
const Bcrypt = require('bcryptjs')
const Kopter = require('../Kopter')
const Request = require('supertest')
const Mongoose = require('mongoose')
const { Container } = require('typedi')
const { USER_MODEL } = require('../utils/constants')
const { PASSWORD_RESETS_SERVICE } = require('../utils/constants')

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
    await Mongoose.connection.close()
})

const generateFakeUser = () => ({
    email: Faker.internet.email(),
    emailConfirmCode: Faker.random.word(),
    password: Bcrypt.hashSync('password')
})

test('/auth/forgot-password can get a reset token', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const user = generateFakeUser()
    await Container.get(USER_MODEL).create(user)

    const response = await Request(app)
        .post('/auth/forgot-password')
        .send({
            email: user.email
        })

    expect(response.body.code).toBe('ok')
    expect(Object.keys(response.body.data)).toMatchSnapshot()
})

test('/auth/reset-password can reset password', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const user = generateFakeUser()
    await Container.get(USER_MODEL).create(user)

    const resetToken = await Request(app)
        .post('/auth/forgot-password')
        .send({
            email: user.email
        })

    const response = await Request(app)
        .put(`/auth/reset-password/${resetToken.body.data.token}`)
        .send({
            password: 'password'
        })

    expect(response.body.code).toBe('ok')
    expect(Object.keys(response.body.data)).toMatchSnapshot()
})

test('/auth/register validates email', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const response = await Request(app)
        .post('/auth/forgot-password')
        .send({})

    expect(response.body.code).toBe('badRequest')
    expect(response.body).toMatchSnapshot()
})
