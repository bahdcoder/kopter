const Kopter = require('../Kopter')
const Mongoose = require('mongoose')
const clearRegisteredModels = require('./test-utils/clear-registered-models')

const defaultKopterConfig = {}

process.env.JWT_SECRET = 'shhh'
process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'
process.env.STRIPE_API_KEY = 'sk_test_BbvXhW3mzZBf52YzR1ihwlqU'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_RMA5R0RsvmJfSRQjbsv0rwiRJKhXJ7Ne'

afterAll(async () => {
    await Mongoose.connection.close()
})

beforeEach(clearRegisteredModels)

test('It initialises a new instance correctly', () => {
    const kopter = new Kopter(defaultKopterConfig)

    expect(kopter.app).toBeDefined()
})

test('It returns the app when init function is called', async () => {
    const kopter = new Kopter(defaultKopterConfig)

    expect(await kopter.init()).toBe(kopter.app)
})

test('It registers body parser if body parser is not set to false', async () => {
    const kopter = new Kopter(defaultKopterConfig)

    jest.spyOn(kopter, 'registerBodyParser')

    await kopter.init()

    expect(kopter.registerBodyParser).toHaveBeenCalled()
})

test('It does not register body parser if body parser is set to false', async () => {
    const kopter = new Kopter({
        ...defaultKopterConfig,
        bodyParser: false
    })

    jest.spyOn(kopter, 'registerBodyParser')

    await kopter.init()

    expect(kopter.registerBodyParser).toHaveBeenCalledTimes(0)
})

test('It registers pino if pino is not set to false', async () => {
    const kopter = new Kopter(defaultKopterConfig)

    jest.spyOn(kopter, 'registerPinoLogger')

    await kopter.init()

    expect(kopter.registerPinoLogger).toHaveBeenCalled()
})

test('It does not register pino logger if pino is set to false', async () => {
    const kopter = new Kopter({
        ...defaultKopterConfig,
        pino: false
    })

    jest.spyOn(kopter, 'registerPinoLogger')

    await kopter.init()

    expect(kopter.registerPinoLogger).toHaveBeenCalledTimes(0)
})

test('It registers dotenv if dotenv is not set to false', async () => {
    const kopter = new Kopter(defaultKopterConfig)

    jest.spyOn(kopter, 'registerDotEnv')

    await kopter.init()

    expect(kopter.registerDotEnv).toHaveBeenCalled()
})

test('It does not register dotenv if dotenv is set to false', async () => {
    const kopter = new Kopter({
        ...defaultKopterConfig,
        dotenv: false
    })

    jest.spyOn(kopter, 'registerDotEnv')

    await kopter.init()

    expect(kopter.registerDotEnv).toHaveBeenCalledTimes(0)
})

test('It registers pino if pino is not set to false', async () => {
    const kopter = new Kopter(defaultKopterConfig)

    jest.spyOn(kopter, 'disableXPoweredByHeader')

    await kopter.init()

    expect(kopter.disableXPoweredByHeader).toHaveBeenCalled()
})

test('It does not register pino logger if pino is set to false', async () => {
    const kopter = new Kopter({
        ...defaultKopterConfig,
        pino: {},
        disableXPoweredByHeader: false
    })

    jest.spyOn(kopter, 'disableXPoweredByHeader')

    await kopter.init()

    expect(kopter.disableXPoweredByHeader).toHaveBeenCalledTimes(0)
})

test('It registers cors if cors is not set to false', async () => {
    const kopter = new Kopter(defaultKopterConfig)

    jest.spyOn(kopter, 'registerCors')

    await kopter.init()

    expect(kopter.registerCors).toHaveBeenCalled()
})

test('It does not register cors if body cors is set to false', async () => {
    const kopter = new Kopter({
        ...defaultKopterConfig,
        cors: false
    })

    jest.spyOn(kopter, 'registerCors')

    await kopter.init()

    expect(kopter.registerCors).toHaveBeenCalledTimes(0)
})
