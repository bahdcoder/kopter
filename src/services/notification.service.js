const { Container } = require('typedi')
const { NOTIFICATION_CHANNELS } = require('../utils/constants')

class Notification {
    async send(users) {
        if (!Array.isArray(users)) {
            users = [users]
        }

        const channels = Container.get(NOTIFICATION_CHANNELS)

        for (let index = 0; index < channels.length; index++) {
            const Channel = channels[index]

            if (!this[Channel.channelName] && !this[Channel.name]) continue

            await new Channel(this).send(users)
        }
    }
}

module.exports = Notification
