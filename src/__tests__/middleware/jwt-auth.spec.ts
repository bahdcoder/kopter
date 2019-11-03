import Express from 'Express'
import Container from 'typedi'
import Jwt from 'jsonwebtoken'
import { Kopter } from '../../Kopter'
import { USER_MODEL } from '../../utils/constants'
import { jwtAuthMiddleware } from '../..//middleware/jwt-auth'
import { generateFakeUser } from '../test-utils/generate-fake-user'

process.env.JWT_SECRET = 'shhhh'
process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'

test('The middleware allows authenticated users to go through just fine', async () => {
    await new Kopter(Express()).init()

    const user: any = await (Container.get(USER_MODEL) as any).create(
        generateFakeUser()
    )
    const token = Jwt.sign({ _id: user._id }, process.env.JWT_SECRET as string)

    const request = {
        headers: {
            authorization: `Bearer ${token}`
        }
    } as Express.Request

    const response = {} as Express.Response
    const next = jest.fn() as Express.NextFunction

    await jwtAuthMiddleware(request, response, next)

    expect(next).toHaveBeenCalled()
})

test('The middleware returns an error if no authorization header is provided', async () => {
    await new Kopter(Express()).init()
    const response = ({
        unauthorized: jest.fn()
    } as unknown) as Express.Response
    const request = {
        headers: {}
    } as Express.Request
    const next = jest.fn() as Express.NextFunction

    await jwtAuthMiddleware(request, response, next)

    expect(next).not.toHaveBeenCalled()
    expect(response.unauthorized).toHaveBeenCalledWith(
        'Invalid authentication token.'
    )
})

test('The middleware returns an error if a valid jwt is malformed', async () => {
    await new Kopter(Express()).init()

    const user: any = await (Container.get(USER_MODEL) as any).create(
        generateFakeUser()
    )
    const token = Jwt.sign({ id: user._id }, process.env.JWT_SECRET as string)

    const response = ({
        unauthorized: jest.fn()
    } as unknown) as Express.Response
    const request = {
        headers: {
            authorization: `Bearer ${token}`
        }
    } as Express.Request
    const next = jest.fn() as Express.NextFunction

    await jwtAuthMiddleware(request, response, next)

    expect(next).not.toHaveBeenCalled()
    expect(response.unauthorized).toHaveBeenCalledWith(
        'Invalid authentication token.'
    )
})
