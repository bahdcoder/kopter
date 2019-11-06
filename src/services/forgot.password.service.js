const Omit = require('object.omit')
const { Container } = require('typedi')
const { USER_MODEL, FORGOT_PASSWORD_MODEL } = require('../utils/constants')

class ForgotPasswordService {
    constructor() {
        this.UserModel = Container.get(USER_MODEL)
        this.ForgotPasswordModel = Container.get(FORGOT_PASSWORD_MODEL)

        this.findUserByEmail = this.findUserByEmail.bind(this)
        this.saveToken = this.saveToken.bind(this)
    }

    async findUserByEmail(email) {
        const user = await this.UserModel.findOne({ email })

        if (!user) throw new Error(`Could not find user with email : ${email}`)

        return user
    }

    async saveToken(data) {
        const resetToken = await this.ForgotPasswordModel.create(data)
        return resetToken
    }

    async deleteToken(token) {
        // const resetToken = this.ForgotPasswordModel.findOne({ token })
        await this.ForgotPasswordModel.deleteOne({ token })
    }

    serializeToken(resetToken) {
        return Omit(resetToken.toObject(), ['__v'])
    }
}

module.exports = ForgotPasswordService
