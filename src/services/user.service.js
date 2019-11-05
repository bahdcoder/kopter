const Bcrypt = require('bcryptjs')
const Jwt = require('jsonwebtoken')
const { Container } = require('typedi')
const { USER_MODEL } = require('../utils/constants')

class UserService {
    constructor() {
        this.UserModel = Container.get(USER_MODEL)
    }

    /**
     * Creates a new user
     * Emits required events
     */
    async create(userData) {
        const user = await this.UserModel.create(userData)

        return user
    }

    async attempt(loginData) {
        const user = await this.UserModel.findOne({ email: loginData.email })

        if (!user) throw new Error('Could not find a user with that email.')

        if (!this.comparePasswords(loginData, user))
            throw new Error('Invalid credentials.')

        return {
            user,
            token: this.generateJWTForUser(user, loginData.rememberMe || false)
        }
    }

    comparePasswords(loginData, user) {
        return Bcrypt.compareSync(loginData.password, user.password)
    }

    generateJWTForUser(user, rememeberMe = false) {
        return Jwt.sign(this.getJWTPayload(user), this.getJWTSecret(), {
            expiresIn: this.getJWTExpiration(rememeberMe)
        })
    }

    getJWTPayload(user) {
        return {
            _id: user._id
        }
    }

    getJWTSecret() {
        return process.env.JWT_SECRET
    }

    getJWTExpiration(rememberMe = false) {
        return rememberMe ? '30d' : '1d'
    }
}

module.exports = UserService
