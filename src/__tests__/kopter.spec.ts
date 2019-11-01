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

    jest.spyOn(kopter, 'registerBodyParser')

    kopter.init()

    expect(kopter.registerBodyParser).toHaveBeenCalled()
})

test('It does not register pino logger if pino is set to false', () => {
    const kopter = new Kopter(Express(), {
        pino: {}
    })

    jest.spyOn(kopter, 'registerPinoLogger')

    kopter.init()

    expect(kopter.registerPinoLogger).toHaveBeenCalled()
})
