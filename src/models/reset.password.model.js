const Mongoose = require('mongoose')

const PasswordResetsSchema = new Mongoose.Schema({
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
        type: Date,
        required: true
    }
})

module.exports = PasswordResetsSchema
