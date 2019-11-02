import { Service, Inject } from 'typedi'

@Service('user.service')
export class UserService {
    public constructor(@Inject('user.model') private UserModel: any) {}

    /**
     * Creates a new user
     * Emits required events
     */
    public async create() {}
}
