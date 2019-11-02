import { Service, Inject } from 'typedi'
import { USER_MODEL, USER_SERVICE } from '../utils/constants'

@Service(USER_SERVICE)
export class UserService {
    public constructor(@Inject(USER_MODEL) private UserModel: any) {}

    /**
     * Creates a new user
     * Emits required events
     */
    public async create(data: any) {
        const user = await this.UserModel.create(data)

        return user
    }
}
