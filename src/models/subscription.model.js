const Mongoose = require('mongoose')

const SubscriptionSchema = new Mongoose.Schema(
    {
        user: {
            type: Mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            required: true
        }
    },
    { timestamps: true }
)

module.exports = SubscriptionSchema
