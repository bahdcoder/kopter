import Express from 'express'
import { Inject } from 'typedi'
import { EventEmitter2 } from 'eventemitter2'
import { validateAll } from 'indicative/validator'
import { UserService } from '../services/user.service'
import {
    USER_SERVICE,
    EVENT_DISPATCHER,
    USER_LOGGED_IN
} from '../utils/constants'

export class LoginController {
    constructor(
        @Inject(USER_SERVICE) private UserService: UserService,
        @Inject(EVENT_DISPATCHER) private EventDispatcher: EventEmitter2
    ) {}

    public login = async (
        request: Express.Request,
        response: Express.Response
    ) => {
        await this.validate(request.body)

        const user = await this.UserService.attempt(request.body)

        this.EventDispatcher.emit(USER_LOGGED_IN, user)

        return this.successResponse(response, user)
    }

    public async validate(data: any) {
        await validateAll(
            data,
            this.validationRules(),
            this.customErrorMessages()
        )
    }

    public validationRules = () => ({
        email: 'required|email',
        password: 'required'
    })

    public customErrorMessages = () => ({})

    public successResponse = (response: Express.Response, user: any) => {
        return response.ok(user)
    }
}
