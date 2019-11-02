import Express from 'express'
import { Kopter } from '../Kopter'

test('It initialises a new instance correctly', () => {
    const kopter = new Kopter(Express())

    expect(kopter.app).toBeDefined()
})

test('It returns the app when init function is called', () => {
    const kopter = new Kopter(Express())

    expect(kopter.init()).toBe(kopter.app)
})

test('It registers body parser if body parser is not set to false', () => {
    const kopter = new Kopter(Express())

    jest.spyOn(kopter, 'registerBodyParser')

    kopter.init()

    expect(kopter.registerBodyParser).toHaveBeenCalled()
})

test('It does not register body parser if body parser is set to false', () => {
    const kopter = new Kopter(Express(), {
        bodyParser: false
    })

    jest.spyOn(kopter, 'registerBodyParser')

    kopter.init()

    expect(kopter.registerBodyParser).toHaveBeenCalledTimes(0)
})

test('It registers pino if pino is not set to false', () => {
    const kopter = new Kopter(Express())

    jest.spyOn(kopter, 'registerPinoLogger')

    kopter.init()

    expect(kopter.registerPinoLogger).toHaveBeenCalled()
})

test('It does not register pino logger if pino is set to false', () => {
    const kopter = new Kopter(Express(), {
        pino: {}
    })

    jest.spyOn(kopter, 'registerPinoLogger')

    kopter.init()

    expect(kopter.registerPinoLogger).toHaveBeenCalled()
})

test('It registers dotenv if dotenv is not set to false', () => {
    const kopter = new Kopter(Express())

    jest.spyOn(kopter, 'registerDotEnv')

    kopter.init()

    expect(kopter.registerDotEnv).toHaveBeenCalled()
})

test('It does not register dotenv if dotenv is set to false', () => {
    const kopter = new Kopter(Express(), {
        dotenv: false
    })

    jest.spyOn(kopter, 'registerDotEnv')

    kopter.init()

    expect(kopter.registerDotEnv).toHaveBeenCalledTimes(0)
})

test('It registers pino if pino is not set to false', () => {
    const kopter = new Kopter(Express())

    jest.spyOn(kopter, 'disableXPoweredByHeader')

    kopter.init()

    expect(kopter.disableXPoweredByHeader).toHaveBeenCalled()
})

test('It does not register pino logger if pino is set to false', () => {
    const kopter = new Kopter(Express(), {
        pino: {},
        disableXPoweredByHeader: false
    })

    jest.spyOn(kopter, 'disableXPoweredByHeader')

    kopter.init()

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
