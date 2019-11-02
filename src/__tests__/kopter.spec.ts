import Express from 'express'
import Mongoose from 'mongoose'
import { Kopter, KopterConfig } from '../Kopter'

const defaultKopterConfig: KopterConfig = {}

process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'

afterAll(async () => {
    await Mongoose.connection.close()
})

test('It initialises a new instance correctly', () => {
    const kopter = new Kopter(Express(), defaultKopterConfig)

    expect(kopter.app).toBeDefined()
})

test('It returns the app when init function is called', async () => {
    const kopter = new Kopter(Express(), defaultKopterConfig)

    expect(await kopter.init()).toBe(kopter.app)
})

test('It registers body parser if body parser is not set to false', async () => {
    const kopter = new Kopter(Express(), defaultKopterConfig)

    jest.spyOn(kopter, 'registerBodyParser')

    await kopter.init()

    expect(kopter.registerBodyParser).toHaveBeenCalled()
})

test('It does not register body parser if body parser is set to false', async () => {
    const kopter = new Kopter(Express(), {
        ...defaultKopterConfig,
        bodyParser: false
    })

    jest.spyOn(kopter, 'registerBodyParser')

    await kopter.init()

    expect(kopter.registerBodyParser).toHaveBeenCalledTimes(0)
})

test('It registers pino if pino is not set to false', async () => {
    const kopter = new Kopter(Express(), defaultKopterConfig)

    jest.spyOn(kopter, 'registerPinoLogger')

    await kopter.init()

    expect(kopter.registerPinoLogger).toHaveBeenCalled()
})

test('It does not register pino logger if pino is set to false', async () => {
    const kopter = new Kopter(Express(), {
        ...defaultKopterConfig,
        pino: false
    })

    jest.spyOn(kopter, 'registerPinoLogger')

    await kopter.init()

    expect(kopter.registerPinoLogger).toHaveBeenCalledTimes(0)
})

test('It registers dotenv if dotenv is not set to false', async () => {
    const kopter = new Kopter(Express(), defaultKopterConfig)

    jest.spyOn(kopter, 'registerDotEnv')

    await kopter.init()

    expect(kopter.registerDotEnv).toHaveBeenCalled()
})

test('It does not register dotenv if dotenv is set to false', async () => {
    const kopter = new Kopter(Express(), {
        ...defaultKopterConfig,
        dotenv: false
    })

    jest.spyOn(kopter, 'registerDotEnv')

    await kopter.init()

    expect(kopter.registerDotEnv).toHaveBeenCalledTimes(0)
})

test('It registers pino if pino is not set to false', async () => {
    const kopter = new Kopter(Express(), defaultKopterConfig)

    jest.spyOn(kopter, 'disableXPoweredByHeader')

    await kopter.init()

    expect(kopter.disableXPoweredByHeader).toHaveBeenCalled()
})

test('It does not register pino logger if pino is set to false', async () => {
    const kopter = new Kopter(Express(), {
        ...defaultKopterConfig,
        pino: {},
        disableXPoweredByHeader: false
    })

    jest.spyOn(kopter, 'disableXPoweredByHeader')

    await kopter.init()

    expect(kopter.disableXPoweredByHeader).toHaveBeenCalledTimes(0)
})

test('It registers cors if cors is not set to false', () => {
    const kopter = new Kopter(Express())

    jest.spyOn(kopter, 'registerCors')

    kopter.init()

    expect(kopter.registerCors).toHaveBeenCalled()
})

test('It does not register cors if body cors is set to false', () => {
    const kopter = new Kopter(Express(), {
        cors: false
    })

    jest.spyOn(kopter, 'registerCors')

    kopter.init()

    expect(kopter.registerCors).toHaveBeenCalledTimes(0)
})
