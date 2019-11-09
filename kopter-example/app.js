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

        cardUpFront: true,

        mustSelectPlan: false
    },

    stripe: {
        plans: [
            {
                name: 'Free',
                id: 'plan_G8uq9K2ajMrlgB',
                price: 0,
                trialDays: 14
            },
            {
                name: 'Basic',
                id: 'basic',
                price: 9,
                trialDays: 5,
                interval: 'yearly'
            },
            {
                name: 'Pro',
                id: 'pro',
                price: 29,
                trialDays: 14,
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
