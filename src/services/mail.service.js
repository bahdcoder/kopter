const Mail = require('friendly-mail')

class MailService {
    constructor(config) {
        this.MailerConfig = config
    }

    /**
     * Send a mail
     * @param mailName string
     *
     * @param customConfig with this we can override MailerConfig
     */
    build(mailName, customConfig) {
        return new Mail(mailName, {
            ...this.MailerConfig,
            ...customConfig
        })
    }
}

module.exports = MailService
