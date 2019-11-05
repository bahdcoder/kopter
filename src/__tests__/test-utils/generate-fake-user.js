const Faker = require('faker')
const Bcrypt = require('bcryptjs')

module.exports = () => ({
    email: Faker.internet.email(),
    emailConfirmCode: Faker.random.word(),
    password: Bcrypt.hashSync('password')
})
