import Faker from 'faker'
import Bcrypt from 'bcryptjs'

export const generateFakeUser = () => ({
    email: Faker.internet.email(),
    emailConfirmCode: Faker.random.word(),
    password: Bcrypt.hashSync('password')
})
