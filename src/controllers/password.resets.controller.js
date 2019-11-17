const Bcrypt = require('bcryptjs')
const { Container } = require('typedi')
const { validateAll } = require('indicative/validator')
const RandomString = require('randomstring')
const {
    PASSWORD_RESETS_SERVICE,
    PASSWORD_RESET,
    EVENT_DISPATCHER
} = require('../utils/constants')

class PasswordResetsController {
    constructor() {
        this.EventEmitter = Container.get(EVENT_DISPATCHER)
        this.PasswordResetsService = Container.get(PASSWORD_RESETS_SERVICE)

        this.resetPassword = this.resetPassword.bind(this)
        this.successResponse = this.successResponse.bind(this)
        this.forgotPassword = this.forgotPassword.bind(this)
        this.validate = this.validate.bind(this)
        this.customMessages = this.customMessages.bind(this)
        this.validationRules = this.validationRules.bind(this)
        this.successResponse = this.successResponse.bind(this)
    }

    async resetPassword(request, response) {
        const resetToken = await this.PasswordResetsService.findToken(
            request.params.token
        )

        await this.PasswordResetsService.setNewPassword(
            resetToken.user,
            Bcrypt.hashSync(request.body.password)
        )

        this.PasswordResetsService.deleteToken(request.params.token)

        return this.successResponse(response, 'Password reset successfully')
    }

    async forgotPassword(request, response) {
        await this.validate(request.body)

        const user = await this.PasswordResetsService.findUserByEmail(
            request.body.email
        )

        const tokenData = {
            token: RandomString.generate(72),
            user: user._id,
            expiresAt: this.PasswordResetsService.getTokenExpiryDate()
        }

        const resetToken = await this.PasswordResetsService.saveToken(tokenData)

        this.EventEmitter.emit(PASSWORD_RESET, {
            token: tokenData.token,
            user
        })

        return this.successResponse(response, 'password reset email sent')
    }

    async validate(data) {
        await validateAll(data, this.validationRules(), this.customMessages())
    }

    validationRules() {
        return {
            email: 'required|string|email'
        }
    }

    customMessages() {
        return {}
    }

    successResponse(response, responseData) {
        return response.ok(responseData)
    }
}

module.exports = PasswordResetsController
