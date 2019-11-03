import Express from 'express'
import Jwt from 'jsonwebtoken'
import { Container } from 'typedi'
import { USER_MODEL } from '../utils/constants'

export const jwtAuthMiddleware = async (
    request: Express.Request,
    response: Express.Response,
    next: Express.NextFunction
) => {
    const bearerToken = request.headers['authorization']

    if (!bearerToken)
        return response.unauthorized('Invalid authentication token.')

    const token = bearerToken.slice(7, bearerToken.length)

    const user: any = Jwt.verify(token, process.env.JWT_SECRET as string)

    if (!user._id) return response.unauthorized('Invalid authentication token.')

    const authUser = await (Container.get(USER_MODEL) as any).findOne({
        _id: user._id
    })

    request.authUser = authUser

    next()
}
