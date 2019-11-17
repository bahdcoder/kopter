const Mongoose = require('mongoose')

const UserSchema = new Mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    name: {
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

module.exports = UserSchema
