const Express = require('express')
const Jwt = require('jsonwebtoken')
require('../test-utils/setup-env')()
const Kopter = require('../../Kopter')
const { Container } = require('typedi')
const { USER_MODEL } = require('../../utils/constants')
const jwtAuthMiddleware = require('../../middleware/jwt-auth')
const generateFakeUser = require('../test-utils/generate-fake-user')
const clearRegisteredModels = require('../test-utils/clear-registered-models')

beforeEach(clearRegisteredModels)

test('The middleware allows authenticated users to go through just fine', async () => {
    await new Kopter(Express()).init()

    const user = await Container.get(USER_MODEL).create(generateFakeUser())
    const token = Jwt.sign({ _id: user._id }, process.env.JWT_SECRET)

    const request = {
        headers: {
            authorization: `Bearer ${token}`
        }
    }

    const response = {}
    const next = jest.fn()

    await jwtAuthMiddleware(request, response, next)

    expect(next).toHaveBeenCalled()
})

test('The middleware returns an error if no authorization header is provided', async () => {
    await new Kopter().init()
    const response = {
        unauthorized: jest.fn()
    }
    const request = {
        headers: {}
    }
    const next = jest.fn()

    await jwtAuthMiddleware(request, response, next)

    expect(next).not.toHaveBeenCalled()
    expect(response.unauthorized).toHaveBeenCalledWith(
        'Invalid authentication token.'
    )
})

test('The middleware returns an error if a valid jwt is malformed', async () => {
    await new Kopter().init()

    const user = await Container.get(USER_MODEL).create(generateFakeUser())
    const token = Jwt.sign({ id: user._id }, process.env.JWT_SECRET)

    const response = {
        unauthorized: jest.fn()
    }
    const request = {
        headers: {
            authorization: `Bearer ${token}`
        }
    }
    const next = jest.fn()

    await jwtAuthMiddleware(request, response, next)

    expect(next).not.toHaveBeenCalled()
    expect(response.unauthorized).toHaveBeenCalledWith(
        'Invalid authentication token.'
    )
})
