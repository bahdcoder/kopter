import Bcrypt from 'bcryptjs'
import Jwt from 'jsonwebtoken'

export class UserService {
    public constructor(private UserModel: any) {}

    /**
     * Creates a new user
     * Emits required events
     */
    public async create(data: any) {
        const user = await this.UserModel.create(data)

        return user
    }

    public async attempt(data: any) {
        const user = await this.UserModel.findOne({ email: data.email })

        if (!user) throw new Error('Could not find a user with that email.')

        if (!this.comparePasswords(data, user))
            throw new Error('Invalid credentials.')

        return {
            user,
            token: this.generateJWTForUser(user, data.rememberMe || false)
        }
    }

    public comparePasswords(data: any, user: any) {
        return Bcrypt.compareSync(data.password, user.password)
    }

    public generateJWTForUser(user: any, rememeberMe: boolean = false) {
        return Jwt.sign(this.getJWTPayload(user), this.getJWTSecret(), {
            expiresIn: this.getJWTExpiration(rememeberMe)
        })
    }

    public getJWTPayload(user: any): any {
        return {
            _id: user._id
        }
    }

    public getJWTSecret(): string {
        return process.env.JWT_SECRET as string
    }

    public getJWTExpiration(rememberMe: Boolean = false): string | number {
        return rememberMe ? '30d' : '1d'
    }
}
