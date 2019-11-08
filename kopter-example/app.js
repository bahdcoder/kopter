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
    },

    billing: {
        currency: 'USD',

        provider: 'stripe',

        cardUpFront: false
    },

    stripe: {
        plans: [
            {
                name: 'Basic',
                id: 'basic',
                price: 9,
                trial: 7,
                interval: 'yearly'
            },
            {
                name: 'Pro',
                id: 'pro',
                price: 29,
                trial: 7,
                interval: 'monthly'
            }
        ]
    }
})
    .init()
    .then(app => {
        const PORT = 5000

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`)
        })
    })
