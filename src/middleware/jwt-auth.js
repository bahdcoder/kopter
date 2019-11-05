const Jwt = require('jsonwebtoken')
const { Container } = require('typedi')
const { USER_MODEL } = require('../utils/constants')

module.exports = jwtAuthMiddleware = async (request, response, next) => {
    const bearerToken = request.headers['authorization']

    if (!bearerToken)
        return response.unauthorized('Invalid authentication token.')

    const token = bearerToken.slice(7, bearerToken.length)

    const user = Jwt.verify(token, process.env.JWT_SECRET)

    if (!user._id) return response.unauthorized('Invalid authentication token.')

    const authUser = await Container.get(USER_MODEL).findOne({
        _id: user._id
    })

    request.authUser = authUser

    next()
}
