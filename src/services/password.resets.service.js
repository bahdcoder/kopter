const Omit = require('object.omit')
const { Container } = require('typedi')
const { USER_MODEL, PASSWORD_RESETS_MODEL } = require('../utils/constants')

class PasswordResetsService {
    constructor() {
        this.PasswordResetsModel = Container.get(PASSWORD_RESETS_MODEL)
        this.UserModel = Container.get(USER_MODEL)

        this.findToken = this.findToken.bind(this)
        this.setNewPassword = this.setNewPassword.bind(this)
    }

    async findToken(token) {
        const resetToken = await this.PasswordResetsModel.findOne({ token })

        if (!resetToken) throw new Error('Invalid Token')

        return resetToken
    }

    expired(date) {
        const currentDate = new Date()
        if (currentDate > date) {
            return true
        }
        return false
    }

    async setNewPassword(userId, password) {
        const user = await this.UserModel.findById(userId)
        user.password = password

        await user.save()
        return user
    }

    async findUserByEmail(email) {
        const user = await this.UserModel.findOne({ email })

        if (!user) throw new Error(`Could not find user with email : ${email}`)

        return user
    }

    async saveToken(data) {
        const resetToken = await this.PasswordResetsModel.create(data)
        return resetToken
    }

    async deleteToken(token) {
        // const resetToken = this.PasswordResetsModel.findOne({ token })
        await this.PasswordResetsModel.deleteOne({ token })
    }

    serializeToken(resetToken) {
        return Omit(resetToken.toObject(), ['__v'])
    }

    serializeResponse(data) {
        return Omit(data.toObject(), ['__v'])
    }
}

module.exports = PasswordResetsService
