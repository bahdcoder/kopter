const Bcrypt = require('bcryptjs')
const { Container } = require('typedi')
const RandomString = require('randomstring')
const { validateAll } = require('indicative/validator')
const {
    EVENT_DISPATCHER,
    USER_SERVICE,
    USER_REGISTERED
} = require('../utils/constants')

class RegisterController {
    constructor() {
        this.UserService = Container.get(USER_SERVICE)
        this.EventEmitter = Container.get(EVENT_DISPATCHER)

        this.register = this.register.bind(this)
        this.validate = this.validate.bind(this)
        this.creationData = this.creationData.bind(this)
        this.validationRules = this.validationRules.bind(this)
        this.customErrorMessages = this.customErrorMessages.bind(this)
    }

    /**
     * Creates a new user
     * Emits required events
     */
    async register(request, response) {
        await this.validate(request.body)

        const user = await this.UserService.create(
            this.creationData(request.body)
        )

        const token = this.UserService.generateJWTForUser(user)

        this.EventEmitter.emit(USER_REGISTERED, user)

        return this.successResponse(response, { user, token })
    }

    async validate(data) {
        await validateAll(
            data,
            this.validationRules(),
            this.customErrorMessages()
        )
    }

    /**
     *
     * Get the data to create user with
     */
    creationData(data) {
        return {
            ...data,
            password: Bcrypt.hashSync(data.password),
            emailConfirmCode: RandomString.generate(72)
        }
    }

    /**
     * Get the validation rules for the
     * user registration
     */
    validationRules() {
        return {
            email: 'required|email|max:40|unique',
            firstName: 'string|max:40',
            lastName: 'string|max:40',
            password: 'required|min:8|max:40'
        }
    }

    customErrorMessages() {
        return {}
    }

    successResponse(response, { user, token }) {
        return response.created({
            user: this.UserService.serializeUser(user),
            token
        })
    }
}

module.exports = RegisterController
