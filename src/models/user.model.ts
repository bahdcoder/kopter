import Mongoose, { Schema } from 'mongoose'

export const UserSchema: Schema = new Mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    emailConfirmCode: {
        type: String,
        required: true
    },
    emailConfirmedAt: {
        type: Date,
        required: false
    }
})
