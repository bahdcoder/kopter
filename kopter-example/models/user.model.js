import { ExtendSchema, UserSchema as DefaultUserSchema } from 'kopter'

const UserSchema = ExtendSchema(DefaultUserSchema, {
    profilePhoto: {
        type: String,
        required: false,
        default: 'https://github.com/avatar.png'
    }
})

export default UserSchema
