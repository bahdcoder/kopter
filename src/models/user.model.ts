import Mongoose, { Schema, Document } from 'mongoose'

export interface UserDocument extends Document {
    email: String
    firstName: String
    lastName: String
    password: String
}

export const UserSchema: Schema = new Mongoose.Schema(
    {
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
        }
    },
    { timestamps: true }
)
