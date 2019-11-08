const Bcrypt = require('bcryptjs')
const { Container } = require('typedi')
const { validateAll } = require('indicative/validator')
const RandomString = require('randomstring')
const addMinutes = require('date-fns/addMinutes')
const addSeconds = require('date-fns/addSeconds')
const { PASSWORD_RESETS_SERVICE } = require('../utils/constants')

class PasswordResetsService {
    constructor() {
        this.PasswordResetsService = Container.get(PASSWORD_RESETS_SERVICE)

        this.setNewPassword = this.setNewPassword.bind(this)
        this.hashPassword = this.hashPassword.bind(this)
        this.successResponse = this.successResponse.bind(this)
        this.forgotPassword = this.forgotPassword.bind(this)
        this.validate = this.validate.bind(this)
        this.customMessages = this.customMessages.bind(this)
        this.validationRules = this.validationRules.bind(this)
        this.successResponse = this.successResponse.bind(this)
    }

    async setNewPassword(request, response) {
        const resetToken = await this.PasswordResetsService.findToken(
            request.params.token
        )

        if (this.PasswordResetsService.expired(resetToken.expiresAt))
            throw new Error('Token Expired')

        const hashedPassword = this.hashPassword(request.body.password)

        await this.PasswordResetsService.setNewPassword(
            resetToken.user,
            hashedPassword
        )

        this.PasswordResetsService.deleteToken(request.params.token)

        return this.successResponse(response, 'Password reset successfully')
    }

    async forgotPassword(request, response) {
        await this.validate(request.body)

        const user = await this.PasswordResetsService.findUserByEmail(
            request.body.email
        )

        const forgotPasswordToken = RandomString.generate(72)
        const tokenData = {
            token: forgotPasswordToken,
            user: user._id,
            expiresAt: addMinutes(new Date(), 10)
        }

        const resetToken = await this.PasswordResetsService.saveToken(tokenData)

        // send email notification to user

        return this.successResponse(response, resetToken)
    }

    async validate(data) {
        await validateAll(data, this.validationRules(), this.customMessages())
    }

    hashPassword(password) {
        return Bcrypt.hashSync(password)
    }

    validationRules() {
        return {
            email: 'required|string|email'
        }
    }

    customMessages() {
        return {}
    }

    successResponse(response, msg) {
        return response.ok(msg)
    }
}

module.exports = PasswordResetsService
