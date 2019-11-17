module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Pino configuration
    |--------------------------------------------------------------------------
    |
    | Configure ...
    |
    */
    pino: false,

    /*
    |--------------------------------------------------------------------------
    | User service
    |--------------------------------------------------------------------------
    |
    | This option controls the default authentication "guard" and password
    | reset options for your application. You may change these defaults
    | as required, but they're a perfect start for most applications.
    |
    */
    UserService: null,

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

        mustSelectPlan: true
    },

    stripe: {
        plans: [
            {
                name: 'Free',
                id: 'plan_G8uq9K2ajMrlgB',
                price: 0
                // trialDays: 14
            },
            {
                name: 'Basic',
                id: 'basic',
                price: 9,
                // trialDays: 5,
                interval: 'yearly'
            },
            {
                name: 'Pro',
                id: 'pro',
                price: 29,
                // trialDays: 14,
                interval: 'monthly'
            }
        ]
    }
}
