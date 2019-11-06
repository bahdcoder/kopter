const Bcrypt = require('bcryptjs')
const { Container } = require('typedi')
const { validateAll } = require('indicative/validator')
const {
    RESET_PASSWORD_SERVICE,
    FORGOT_PASSWORD_SERVICE
} = require('../utils/constants')

class ResetPasswordController {
    constructor() {
        this.ResetPasswordService = Container.get(RESET_PASSWORD_SERVICE)
        this.ForgotPasswordService = Container.get(FORGOT_PASSWORD_SERVICE)

        this.setNewPassword = this.setNewPassword.bind(this)
        this.hashPassword = this.hashPassword.bind(this)
        this.successResponse = this.successResponse.bind(this)
    }

    async setNewPassword(request, response) {
        const token = request.params.token
        const resetToken = await this.ResetPasswordService.findToken(token)

        const userId = resetToken.user
        const hashedPassword = this.hashPassword(request.body.password)

        const user = await this.ResetPasswordService.setNewPassword(
            userId,
            hashedPassword
        )

        if (user) this.ForgotPasswordService.deleteToken(token)
        return this.successResponse(response, user)
    }

    /**
     *
     * hash the password
     */
    hashPassword(password) {
        return Bcrypt.hashSync(password)
    }

    successResponse(response, user) {
        return response.created({
            user: this.ResetPasswordService.serializeResponse(user)
        })
    }
}

module.exports = ResetPasswordController
