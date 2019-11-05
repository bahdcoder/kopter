const {
    USER_SERVICE,
    EVENT_DISPATCHER,
    USER_LOGGED_IN
} = require('../utils/constants')
const { Container } = require('typedi')
const { validateAll } = require('indicative/validator')

class LoginController {
    constructor() {
        this.UserService = Container.get(USER_SERVICE)
        this.EventDispatcher = Container.get(EVENT_DISPATCHER)

        this.login = this.login.bind(this)
        this.validate = this.validate.bind(this)
        this.validationRules = this.validationRules.bind(this)
        this.successResponse = this.successResponse.bind(this)
        this.customErrorMessages = this.customErrorMessages.bind(this)
    }

    async login(request, response) {
        await this.validate(request.body)

        const { user, token } = await this.UserService.attempt(request.body)

        this.EventDispatcher.emit(USER_LOGGED_IN, user)

        return this.successResponse(response, { user, token })
    }

    async validate(data) {
        await validateAll(
            data,
            this.validationRules(),
            this.customErrorMessages()
        )
    }

    validationRules() {
        return {
            email: 'required|email',
            password: 'required'
        }
    }

    customErrorMessages() {
        return {}
    }

    successResponse(response, { user, token }) {
        return response.ok({
            user: this.UserService.serializeUser(user),
            token
        })
    }
}

module.exports = LoginController
