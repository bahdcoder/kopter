import Express from 'express'
import { Inject } from 'typedi'
import { UserService } from '../services/user.service'

export class RegisterController {
    public constructor(
        @Inject('user.service') private UserService: UserService
    ) {}

    /**
     * Creates a new user
     * Emits required events
     */
    public register = async (req: Express.Request, res: Express.Response) => {
        return res.json({})
    }
}
