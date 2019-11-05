const { Container } = require('typedi')

class Notification {
    constructor() {
        this.mail = null
        this.database = null
        this.UserModel = Container.get(USER_MODEL)
    }

    toMail() {
        this.mail = mail
    }

    toDatabase() {
        this.database = database
    }

    send() {}
}

module.exports = Notification
