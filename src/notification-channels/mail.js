const { Container } = require('typedi')
const { MAIL_SERVICE } = require('../utils/constants')

class MailNotificationChannel {
    constructor(notification) {
        this.notification = notification

        this.send = this.send.bind(this)
    }

    async send(users) {
        const MailService = Container.get(MAIL_SERVICE)

        const mailConfig = this.notification.Mail

        for (let index = 0; index < users.length; index++) {
            const user = users[index]

            console.log('-------->', user)

            if (mailConfig.sendMailWith) {
                await mailConfig.sendMailWith(user)
            } else {
                await MailService.build(mailConfig.mailName)
                    .to(user.email)
                    .data(mailConfig.data || {})
                    .subject(mailConfig.subject)
                    .send()
            }
        }
    }
}

MailNotificationChannel.channelName = 'Mail'

module.exports = MailNotificationChannel
