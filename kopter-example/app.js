import Express from 'express'
import { Kopter } from 'kopter'

import UserSchema from './models/user.model'
import UserService from './services/user.service'

new Kopter({
    UserSchema,
    pino: false,
    UserService,
    mail: {
        views: '/mails',
        ethereal: {
            driver: 'ethereal'
        }
    }
})
    .init()
    .then(app => {
        const PORT = 5000

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`)
        })
    })
