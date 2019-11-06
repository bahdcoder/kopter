const Omit = require('object.omit')
const { Container } = require('typedi')
const { USER_MODEL, FORGOT_PASSWORD_MODEL } = require('../utils/constants')

class ResetPasswordService {
    constructor() {
        this.ForgotPasswordModel = Container.get(FORGOT_PASSWORD_MODEL)
        this.UserModel = Container.get(USER_MODEL)

        this.findToken = this.findToken.bind(this)
        this.setNewPassword = this.setNewPassword.bind(this)
    }

    async findToken(token) {
        const resetToken = await this.ForgotPasswordModel.findOne({ token })

        if (!resetToken) throw new Error('Invalid Token')

        return resetToken
    }

    async setNewPassword(userId, password) {
        const user = await this.UserModel.findById(userId)
        user.password = password

        await user.save()
        return user
    }

    serializeResponse(data) {
        return Omit(data.toObject(), ['__v'])
    }
}

module.exports = ResetPasswordService
