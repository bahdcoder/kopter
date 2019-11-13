const Faker = require('faker')
const Kopter = require('../Kopter')
const Request = require('supertest')
const Mongoose = require('mongoose')
const { Container } = require('typedi')
const { USER_MODEL, SUBSCRIPTION_MODEL } = require('../utils/constants')
const clearRegisteredModels = require('./test-utils/clear-registered-models')

process.env.JWT_SECRET = 'shhh'
process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter'
process.env.STRIPE_API_KEY = 'sk_test_BbvXhW3mzZBf52YzR1ihwlqU'

jest.mock('stripe', () => stripeKey => ({
    subscriptions: {
        create(subscriptionDetails) {
            const payment_intent = {
                status: 'succeeded'
            }

            if (
                subscriptionDetails.customer ===
                'CUSTOMER_ID_THAT_TRIGGERS_PAYMENT_INTENT_THAT_REQUIRES_ACTION'
            ) {
                payment_intent.status = 'requires_action'
            }

            return {
                id: '7a7178b5-a2e8-4229-a278-fa9de97cc4f8',
                ...subscriptionDetails,
                latest_invoice: {
                    payment_intent
                },
                status: 'active',
                trial_end: new Date('2020.10.10').getTime() / 1000
            }
        },
        update(stripeSubscriptionId, options) {
            return {
                id: stripeSubscriptionId,
                ...options,
                status: 'active',
                current_period_end: new Date('2020.10.10').getTime() / 1000
            }
        },
        retrieve(stripeSubscriptionId) {
            return {
                id: stripeSubscriptionId,
                items: {
                    data: [
                        {
                            id: 'sub_fA9de97Cc4F8'
                        }
                    ]
                }
            }
        }
    },
    customers: {
        create(customerDetails) {
            let customerId = '6e79e583-bbbd-4bc6-a5e1-5d5220819dbb'

            if (
                customerDetails.payment_method ===
                'TEST_PAYMENT_METHOD_THAT_FAILS'
            ) {
                const error = new Error('Payment failed. Insufficient funds.')

                error.raw = {
                    code: 'card_declined'
                }

                throw error
            }

            if (
                customerDetails.payment_method ===
                'TEST_PAYMENT_METHOD_THAT_TRIGGERS_A_PAYMENT_INTENT_THAT_REQUIRES_ACTION'
            ) {
                customerId =
                    'CUSTOMER_ID_THAT_TRIGGERS_PAYMENT_INTENT_THAT_REQUIRES_ACTION'
            }

            return {
                id: customerId,
                ...customerDetails
            }
        }
    },
    paymentMethods: {
        retrieve(paymentMethod) {
            return {
                paymentMethod,
                card: {
                    brand: 'VISA',
                    last4: '4242'
                }
            }
        }
    },
    invoices: {
        create() {}
    }
}))

const defaultKopterConfig = {
    pino: false,
    mail: {
        connection: 'memory',
        views: '/src/mails',
        viewEngine: 'handlebars',
        memory: {
            driver: 'memory'
        }
    }
}

const defaultBillingConfig = {
    ...defaultKopterConfig,

    billing: {
        provider: 'stripe',

        cardUpFront: true,

        mustSelectPlan: true
    },

    stripe: {
        plans: [
            {
                name: 'Free',
                id: 'free',
                price: 0
            },
            {
                name: 'Basic',
                id: 'basic',
                price: 9,
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
}

afterAll(async () => {
    await Mongoose.connection.close()
})

beforeEach(() => {
    clearRegisteredModels()

    Container.reset()
})

const generateFakeUser = () => ({
    email: Faker.internet.email(),
    password: Faker.internet.password(),
    emailConfirmCode: Faker.random.word()
})

test('/auth/register can register a new user to the database', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const user = generateFakeUser()
    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: user.email,
            password: user.password
        })

    expect(response.body.code).toBe('created')
    expect(Object.keys(response.body.data)).toMatchSnapshot()
})

test('/auth/register does not allow duplicate emails', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const user = generateFakeUser()
    await Container.get(USER_MODEL).create(user)

    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: user.email,
            password: user.password
        })

    expect(response.body).toMatchSnapshot()
})

test('/auth/register validates email and password correctly', async () => {
    const app = await new Kopter(defaultKopterConfig).init()

    const response = await Request(app)
        .post('/auth/register')
        .send({})

    expect(response.body).toMatchSnapshot()
})

test('/auth/register with billing enabled returns correct validation errors', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    const user = generateFakeUser()

    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: user.email,
            password: user.password
        })

    expect(response.body).toMatchSnapshot()
})

test('/auth/register registers user correctly and subscribes her when paymentMethod and plan are provided', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    await Container.get(SUBSCRIPTION_MODEL).deleteMany({})

    const user = generateFakeUser()

    const response = await Request(app)
        .post('/auth/register')
        .send({
            plan: 'pro',
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD'
        })

    const subscription = await Container.get(SUBSCRIPTION_MODEL).find()

    // subscription assertions
    expect(subscription.length).toBe(1)
    expect(subscription[0].stripeId).toBe(
        '7a7178b5-a2e8-4229-a278-fa9de97cc4f8'
    )

    // response assertions
    expect(Object.keys(response.body.data)).toMatchSnapshot()
    expect(response.body.code).toMatchInlineSnapshot(`"created"`)
    expect(response.body.data.subscription.paymentIntentStatus).toBe(
        'succeeded'
    )
})

test('/auth/register gracefully handles a failed payment method and deletes the newly created user', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    const user = generateFakeUser()

    const response = await Request(app)
        .post('/auth/register')
        .send({
            plan: 'pro',
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD_THAT_FAILS'
        })

    const createdUser = await Container.get(USER_MODEL).findOne({
        email: user.email
    })

    expect(createdUser).toBeNull()
    expect(response.body.code).toMatchInlineSnapshot(`"badRequest"`)
    expect(response.body.data).toBe('Payment failed. Insufficient funds.')
})

test('/auth/register can register a user without starting a subscription for the user', async () => {
    const app = await new Kopter({
        ...defaultBillingConfig,
        billing: {
            ...defaultBillingConfig.billing,
            mustSelectPlan: false
        }
    }).init()

    const user = generateFakeUser()

    const response = await Request(app)
        .post('/auth/register')
        .send({
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD'
        })

    const createdUser = await Container.get(USER_MODEL).findOne({
        email: user.email
    })

    expect(response.body.code).toBe('created')

    expect(createdUser.cardBrand).toBe('VISA')
    expect(createdUser.cardLastFour).toBe('4242')
})

test('/auth/register can register a user with a payment intent that requires additional action', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    const user = generateFakeUser()

    const response = await Request(app)
        .post('/auth/register')
        .send({
            plan: 'basic',
            email: user.email,
            password: user.password,
            paymentMethod:
                'TEST_PAYMENT_METHOD_THAT_TRIGGERS_A_PAYMENT_INTENT_THAT_REQUIRES_ACTION'
        })

    const createdUser = await Container.get(USER_MODEL).findOne({
        email: user.email
    })

    expect(response.body.code).toBe('created')
    expect(response.body.data.subscription.paymentIntentStatus).toBe(
        'requires_action'
    )
})

test('/subscriptions/cancel can cancel a subscription for a user and set them on grace period', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    await Container.get(SUBSCRIPTION_MODEL).deleteMany({})
    const user = generateFakeUser()

    const registerResponse = await Request(app)
        .post('/auth/register')
        .send({
            plan: 'pro',
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD'
        })

    const response = await Request(app)
        .put('/subscriptions/cancel')
        .set('Authorization', `Bearer ${registerResponse.body.data.token}`)
        .send({
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD'
        })
    const subscription = await Container.get(SUBSCRIPTION_MODEL).find({})

    expect(response.body.code).toBe('ok')
    expect(subscription[0].endsAt).not.toBeNull()
    expect(response.body.data).toBe('Subscription cancelled.')
})

test('/subscriptions/resume can resume a canceled subscription for a user and set them back on active', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    await Container.get(SUBSCRIPTION_MODEL).deleteMany({})
    const user = generateFakeUser()

    const registerResponse = await Request(app)
        .post('/auth/register')
        .send({
            plan: 'pro',
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD'
        })

    await Request(app)
        .put('/subscriptions/cancel')
        .set('Authorization', `Bearer ${registerResponse.body.data.token}`)

    const response = await Request(app)
        .put('/subscriptions/resume')
        .set('Authorization', `Bearer ${registerResponse.body.data.token}`)

    const subscription = await Container.get(SUBSCRIPTION_MODEL).find({})

    expect(response.body.code).toBe('ok')
    expect(subscription[0].endsAt).toBeNull()
    expect(response.body.data).toBe('Subscription resumed.')
})

test('/subscriptions/resume cannot resume a canceled subscription if one does not exist', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    await Container.get(SUBSCRIPTION_MODEL).deleteMany({})
    const user = generateFakeUser()

    const registerResponse = await Request(app)
        .post('/auth/register')
        .send({
            plan: 'pro',
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD'
        })

    const response = await Request(app)
        .put('/subscriptions/resume')
        .set('Authorization', `Bearer ${registerResponse.body.data.token}`)

    expect(response.body.code).toBe('badRequest')
    expect(response.body.data).toBe(
        'User has no subscriptions that can be resumed.'
    )
})

test('/subscriptions/switch can change a user subscription plan', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    await Container.get(SUBSCRIPTION_MODEL).deleteMany({})
    const user = generateFakeUser()

    const registerResponse = await Request(app)
        .post('/auth/register')
        .send({
            plan: 'pro',
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD'
        })

    const response = await Request(app)
        .put('/subscriptions/switch')
        .set('Authorization', `Bearer ${registerResponse.body.data.token}`)
        .send({
            plan: 'basic'
        })

    expect(response.body.code).toBe('ok')
    expect(response.body.data).toBe('Subscription switched.')
})

test('/subscriptions/switch returns an error if user is trying to switch to a plan she is already subscribed to', async () => {
    const app = await new Kopter(defaultBillingConfig).init()

    await Container.get(SUBSCRIPTION_MODEL).deleteMany({})
    const user = generateFakeUser()

    const registerResponse = await Request(app)
        .post('/auth/register')
        .send({
            plan: 'pro',
            email: user.email,
            password: user.password,
            paymentMethod: 'TEST_PAYMENT_METHOD'
        })

    const response = await Request(app)
        .put('/subscriptions/switch')
        .set('Authorization', `Bearer ${registerResponse.body.data.token}`)
        .send({
            plan: 'pro'
        })

    expect(response.body.code).toBe('badRequest')
    expect(response.body.data).toBe('User is already subscribed to plan pro')
})
