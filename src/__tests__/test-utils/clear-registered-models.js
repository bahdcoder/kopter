const Mongoose = require('mongoose')

module.exports = () =>
    ['User', 'Notification', 'Subscription'].forEach(Model => {
        delete Mongoose.connection.models[Model]
    })
