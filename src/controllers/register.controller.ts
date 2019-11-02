import Express from 'express'
import Bcrypt from 'bcryptjs'
import { Inject } from 'typedi'
import RandomString from 'randomstring'
import { EventEmitter2 } from 'eventemitter2'
import { validateAll } from 'indicative/validator'
import {
    EVENT_DISPATCHER,
    USER_SERVICE,
    USER_REGISTERED
} from '../utils/constants'
import { UserService } from '../services/user.service'

export class RegisterController {
    public constructor(
        @Inject(USER_SERVICE) private UserService: UserService,
        @Inject(EVENT_DISPATCHER) private EventEmitter: EventEmitter2
    ) {}

    /**
     * Creates a new user
     * Emits required events
     */
    public register = async (
        request: Express.Request,
        response: Express.Response
    ) => {
        await this.validate(request.body)

        const user = await this.UserService.create(
            this.creationData(request.body)
        )

        this.EventEmitter.emit(USER_REGISTERED, user)

        return response.created(user)
    }

    public validate = async (data: any) => {
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
    public creationData = (data: any) => ({
        ...data,
        password: Bcrypt.hashSync(data.password),
        emailConfirmCode: RandomString.generate(72)
    })

    /**
     * Get the validation rules for the
     * user registration
     */
    public validationRules = () => ({
        email: 'required|email|max:40|unique',
        firstName: 'string|max:40',
        lastName: 'string|max:40',
        password: 'required|min:8|max:40'
    })

    public customErrorMessages = () => ({})
}
