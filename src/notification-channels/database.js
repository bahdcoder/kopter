const { Container } = require('typedi')
const { NOTIFICATION_MODEL } = require('../utils/constants')

class DatabaseNotificationChannel {
    constructor(notification) {
        this.notification = notification

        this.send = this.send.bind(this)
    }

    async send(users = []) {
        const NotificationModel = Container.get(NOTIFICATION_MODEL)

        for (let index = 0; index < users.length; index++) {
            const user = users[index]

            await NotificationModel.create({
                ...this.notification.Database,
                user: user._id
            })
        }
    }
}

DatabaseNotificationChannel.channelName = 'Database'

module.exports = DatabaseNotificationChannel
