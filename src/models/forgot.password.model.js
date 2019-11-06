const Mongoose = require('mongoose')

const ForgotPasswordSchema = new Mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    user: {
        type: Mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        ref: 'User'
    },
    expiresAt: {
        // install date-fns
        type: Date,
        required: true
    }
})

module.exports = ForgotPasswordSchema
