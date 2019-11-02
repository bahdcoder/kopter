import { ExtendSchema, UserSchema as DefaultUserSchema } from 'kopter'

const UserSchema = ExtendSchema(DefaultUserSchema, {
    stripeKey: {
        type: String,
        required: false
    }
})

export default UserSchema
