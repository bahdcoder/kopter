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
