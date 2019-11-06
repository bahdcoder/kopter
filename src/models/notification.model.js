const Mongoose = require('mongoose')

const NotificationSchema = new Mongoose.Schema({
    type: {
        required: true,
        type: Mongoose.Schema.Types.String
    },
    user: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    data: {
        type: Object,
        required: true
    },
    readAt: {
        type: Mongoose.Schema.Types.Date,
        required: false
    },
    createdAt: {
        type: Mongoose.Schema.Types.Date,
        default: new Date(),
        required: false
    }
})

module.exports = NotificationSchema
