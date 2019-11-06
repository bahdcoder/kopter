const { Container } = require('typedi')
const RandomString = require('randomstring')
var addMinutes = require('date-fns/addMinutes')
const { validateAll } = require('indicative/validator')
const { FORGOT_PASSWORD_SERVICE } = require('../utils/constants')

class ForgotPasswordController {
    constructor() {
        this.ForgotPasswordService = Container.get(FORGOT_PASSWORD_SERVICE)

        this.forgotPassword = this.forgotPassword.bind(this)
        this.validate = this.validate.bind(this)
        this.customMessages = this.customMessages.bind(this)
        this.validationRules = this.validationRules.bind(this)
        this.successResponse = this.successResponse.bind(this)
    }

    async forgotPassword(request, response) {
        // validate data from frontend
        await this.validate(request.body)
        // find user by email
        const user = await this.ForgotPasswordService.findUserByEmail(
            request.body.email
        )
        // generate tokenn for user
        const forgotPasswordToken = RandomString.generate(72)
        // save token to database
        const tokenData = {
            token: forgotPasswordToken,
            user: user._id,
            expiresAt: addMinutes(new Date(), 60)
        }

        const resetToken = await this.ForgotPasswordService.saveToken(tokenData)
        // send email notification to user

        // return an ok status code to user
        //
        return this.successResponse(response, resetToken)
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

    successResponse(response, resetToken) {
        return response.created({
            resetToken: this.ForgotPasswordService.serializeToken(resetToken)
        })
    }
}

module.exports = ForgotPasswordController
