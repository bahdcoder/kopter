const Fs = require('fs')
const Path = require('path')
const Bull = require('bull')
const Cors = require('cors')
const Dotenv = require('dotenv')
const Express = require('express')
const Omit = require('object.omit')
const Mongoose = require('mongoose')
const DeepMerge = require('deepmerge')
const { Container } = require('typedi')
const BodyParser = require('body-parser')
const { getValue } = require('indicative-utils')
const PinoLogger = require('express-pino-logger')
const { extend } = require('indicative/validator')
const { EventEmitter2 } = require('eventemitter2')
const asyncRequest = require('./utils/async-request')

const {
    USER_MODEL,
    USER_SERVICE,
    MAIL_SERVICE,
    X_POWERED_BY,
    KOPTER_CONFIG,
    USER_REGISTERED,
    BILLING_SERVICE,
    EVENT_DISPATCHER,
    BILLING_PROVIDER,
    NOTIFICATION_MODEL,
    SUBSCRIPTION_MODEL,
    NOTIFICATION_SERVICE,
    NOTIFICATION_CHANNELS,
    PASSWORD_RESETS_MODEL,
    PASSWORD_RESETS_SERVICE,
    PASSWORD_RESET
} = require('./utils/constants')
const UserSchema = require('./models/user.model')
const StatusCodes = require('./utils/status-codes')
const ExtendSchema = require('./utils/extend-schema')
const UserService = require('./services/user.service')
const MailService = require('./services/mail.service')
const jwtAuthMiddleware = require('./middleware/jwt-auth')
const BillingService = require('./services/billing.service')
const NotificationSchema = require('./models/notification.model')
const SubscriptionSchema = require('./models/subscription.model')
const LoginController = require('./controllers/login.controller')
const PasswordResetsSchema = require('./models/reset.password.model')
const StripeBillingProvider = require('./billing-providers/stripe')
const NotificationService = require('./services/notification.service')
const RegisterController = require('./controllers/register.controller')
const MailNotificationChannel = require('./notification-channels/mail')
const PasswordResetsService = require('./services/password.resets.service')
const SubscriptionController = require('./controllers/subscription.controller')
const DatabaseNotificationChannel = require('./notification-channels/database')
const PasswordResetsController = require('./controllers/password.resets.controller')

class Kopter {
    constructor(config = {}) {
        this.app = Express()

        this.config = {
            bodyParser: {},
            pino: {},
            dotenv: {},
            cors: {},
            UserSchema,
            UserService,
            MailService,
            BillingService,
            SubscriptionSchema,
            NotificationSchema,
            PasswordResetsSchema,
            PasswordResetsService,
            StripeBillingProvider,
            notificationChannels: [
                MailNotificationChannel,
                DatabaseNotificationChannel
            ],
            disableXPoweredByHeader: true,
            mongoose: {
                useCreateIndex: true,
                useNewUrlParser: true,
                useUnifiedTopology: true
            },
            mail: {
                views: 'src/mails',
                connection: 'ethereal',
                viewEngine: 'handlebars'
            },
            disableRegistrationEventListeners: false,
            disablePasswordResetsEventListeners: false,
            queue: {
                workers: [
                    {
                        name: 'mails.queue',
                        options: {},
                        handler({ job, done, Container: Con }) {
                            console.log(
                                '############# sending emails here',
                                job.data,
                                Con.globalInstance
                            )
                        }
                    },
                    {
                        name: 'delete-users.queue',
                        options: {},
                        handler() {
                            console.log(
                                '############# DELETING USERS HERE HERE'
                            )
                        }
                    }
                ]
            }
        }

        const plainConfig = Omit(config, [
            'UserSchema',
            'UserService',
            'MailService',
            'NotificationSchema',
            'BillingService',
            'NotificationSchema',
            'SubscriptionSchema',
            'PasswordResetsSchema',
            'StripeBillingProvider',
        ])

        const plainDefaultConfig = Omit(this.config, [
            'UserSchema',
            'UserService',
            'MailService',
            'BillingService',
            'NotificationSchema',
            'SubscriptionSchema',
            'PasswordResetsSchema',
            'StripeBillingProvider',
        ])

        /**
         *
         * Let's add more fields to the user schema,
         * depending on the billing of the user
         *
         * Stripe billing
         *
         * Braintree billing
         *
         * Paystack billing
         */
        let billingFields = {}
        let subscriptionFields = {}

        if (config.billing && config.billing.provider === 'stripe') {
            subscriptionFields = {
                stripeId: {
                    type: Mongoose.Schema.Types.String,
                    required: true
                },
                stripeStatus: {
                    type: Mongoose.Schema.Types.String,
                    required: true
                },
                paymentIntentStatus: {
                    type: Mongoose.Schema.Types.String,
                    required: false
                },
                stripePlan: {
                    type: Mongoose.Schema.Types.String,
                    required: true
                },
                quantity: {
                    type: Mongoose.Schema.Types.Number,
                    required: false,
                    default: 1
                },
                trialEndsAt: {
                    type: Mongoose.Schema.Types.Date,
                    required: false
                },
                endsAt: {
                    type: Mongoose.Schema.Types.Date,
                    required: false
                }
            }

            billingFields = {
                stripeId: {
                    type: String,
                    index: true,
                    required: false
                },
                cardBrand: {
                    type: String,
                    required: false
                },
                cardLastFour: {
                    type: String,
                    required: false
                },
                trialEndsAt: {
                    type: Date,
                    required: false
                },
                billingInformation: new Mongoose.Schema({
                    address: {
                        type: String,
                        required: false
                    },
                    addressLine2: {
                        type: String,
                        required: false
                    },
                    phone: {
                        type: String,
                        required: false
                    },
                    country: {
                        type: String,
                        required: false
                    },
                    city: {
                        type: String,
                        required: false
                    },
                    zip: {
                        type: String,
                        required: false
                    },
                    extraInformation: {
                        type: Object,
                        required: false
                    }
                })
            }
        }

        const UserSchemaWithBilling = ExtendSchema(
            config.UserSchema || this.config.UserSchema,
            billingFields
        )

        const SubscriptionSchemaWithProvider = ExtendSchema(
            config.SubscriptionSchema || this.config.SubscriptionSchema,
            subscriptionFields
        )

        /**
         * Merge the config with the default one.
         */
        this.config = {
            UserSchema: UserSchemaWithBilling,
            UserService: config.UserService || this.config.UserService,
            MailService: config.MailService || this.config.MailService,
            PasswordResetsSchema:
                config.PasswordResetsSchema || this.config.PasswordResetsSchema,
            PasswordResetsService:
                config.PasswordResetsService ||
                this.config.PasswordResetsService,
            BillingService: config.BillingService || this.config.BillingService,
            NotificationSchema:
                config.NotificationSchema || this.config.NotificationSchema,
            SubscriptionSchema: SubscriptionSchemaWithProvider,
            StripeBillingProvider:
                config.StripeBillingProvider ||
                this.config.StripeBillingProvider,
            ...DeepMerge(plainDefaultConfig, plainConfig)
        }

        Container.set(KOPTER_CONFIG, this.config)
    }

    /**
     * Registers the body-parser middleware
     */
    registerBodyParser() {
        this.app.use(BodyParser.json(this.config.bodyParser || {}))
    }

    /**
     * Disable x-powered-by header added by default in express
     */
    disableXPoweredByHeader() {
        this.app.disable(X_POWERED_BY)
    }

    registerQueueWorkers() {
        this.config.queue.workers.forEach(worker => {
            Container.set(worker.name, new Bull(worker.name))
        })
    }

    registerBillingProvider() {
        if (!this.config.billing || !this.config.billing.provider) {
            Container.set(BILLING_PROVIDER, {})

            return
        }

        switch (this.config.billing.provider) {
            case 'stripe':
                Container.set(
                    BILLING_PROVIDER,
                    new this.config.StripeBillingProvider()
                )

                break
            default:
                Container.set(BILLING_PROVIDER, {})
                break
        }
    }

    /**
     * Registers the pino logger middleware
     */
    registerPinoLogger() {
        this.app.use(PinoLogger(this.config.pino || {}))
    }

    registerEventEmitter() {
        Container.set(EVENT_DISPATCHER, new EventEmitter2({}))
    }

    /**
     * Register the dotenv package
     */
    registerDotEnv() {
        Dotenv.config(this.config.dotenv || {})
    }

    /**
     * Register the cors package
     */
    registerCors() {
        this.app.use(Cors(this.config.cors))
    }

    /**
     * Fetches all models and registers them into DI container
     */
    registerModelsIntoContainer() {
        Container.set(
            USER_MODEL,
            Mongoose.model('User', this.config.UserSchema)
        )

        Container.set(
            NOTIFICATION_MODEL,
            Mongoose.model('Notification', this.config.NotificationSchema)
        )

        Container.set(
            PASSWORD_RESETS_MODEL,
            Mongoose.model('ResetPassword', this.config.PasswordResetsSchema)
        )
        
        Container.set(
            SUBSCRIPTION_MODEL,
            Mongoose.model('Subscription', this.config.SubscriptionSchema)
        )
    }

    registerNotificationChannels() {
        const Notification = new NotificationService()

        Container.set(NOTIFICATION_CHANNELS, this.config.notificationChannels)

        this.config.notificationChannels.forEach(channel => {
            Notification[
                `to${channel.channelName || channel.name}`
            ] = channelData => {
                Notification[channel.channelName || channel.name] = channelData

                return Notification
            }
        })

        Container.set(NOTIFICATION_SERVICE, Notification)
    }

    registerServices() {
        Container.set(USER_SERVICE, new this.config.UserService())

        Container.set(
            MAIL_SERVICE,
            new this.config.MailService(this.config.mail)
        )

        Container.set(
            PASSWORD_RESETS_SERVICE,
            new this.config.PasswordResetsService()
        )
        
        Container.set(BILLING_SERVICE, new this.config.BillingService())
    }

    registerRegistrationEventListeners() {
        if (this.config.disableRegistrationEventListeners) return
        this.registerEventEmitters(
            'confirm-email',
            USER_REGISTERED,
            'Welcome to Kopter !!!'
        )
    }

    registerPasswordResetEventListener() {
        if (this.config.disablePasswordResetsEventListeners) return
        this.registerEventEmitters(
            'password-reset',
            PASSWORD_RESET,
            'Reset Password !!!'
        )
    }

    registerEventEmitters(mailName, event, subject) {
        const config = this.config.mail

        Container.get(EVENT_DISPATCHER).on(event, async user => {
            const mailFolder = process.cwd() + config.views

            const customMailConfig = {}

            if (!Fs.existsSync(`${mailFolder}/${mailName}`)) {
                customMailConfig.useCustomMailPaths = true

                customMailConfig.views = Path.resolve(__dirname, 'mails')
            }

            Container.get('mails.queue').add({
                data: user,
                mailName,
                customMailConfig,
                subject,
                recipients: user.email
            })
        })
    }

    /**
     * Connects to mongoose or gracefully shuts down
     */
    establishDatabaseConnection() {
        return Mongoose.connect(process.env.MONGODB_URL, this.config.mongoose)
    }

    getAuthRouter() {
        const router = Express.Router()
        this.app.use('/auth', router)

        return router
    }

    getSubscriptionsRouter() {
        const router = Express.Router()

        this.app.use('/subscriptions', router)

        return router
    }

    extendIndicative() {
        extend('unique', {
            async: true,

            validate: (data, field) =>
                Container.get(USER_MODEL)
                    .findOne({ [field]: getValue(data, field) })
                    .then(user => (user ? false : true))
                    .catch(() => false)
        })
    }

    registerResponseHelpers() {
        this.app.use((request, response, next) => {
            Object.keys(StatusCodes).forEach(status => {
                const statusCode = StatusCodes[status]
                response[status] = data =>
                    response.status(statusCode).json({
                        code: status,
                        data
                    })
            })
            next()
        })
    }

    registerSubscriptionRoutes() {
        const router = this.getSubscriptionsRouter()

        router.put(
            '/cancel',
            jwtAuthMiddleware,
            asyncRequest(Container.get(SubscriptionController).cancel)
        )

        router.put(
            '/resume',
            jwtAuthMiddleware,
            asyncRequest(Container.get(SubscriptionController).resume)
        )

        router.put(
            '/switch',
            jwtAuthMiddleware,
            asyncRequest(Container.get(SubscriptionController).switch)
        )
    }

    registerAuthRoutes() {
        const router = this.getAuthRouter()

        router.post(
            '/register',
            asyncRequest(Container.get(RegisterController).register)
        )

        router.post(
            '/login',
            asyncRequest(Container.get(LoginController).login)
        )

        router.post(
            '/forgot-password',
            asyncRequest(Container.get(PasswordResetsController).forgotPassword)
        )

        router.put(
            '/reset-password/:token',
            asyncRequest(Container.get(PasswordResetsController).resetPassword)
        )
    }

    initConsole() {
        this.registerEventEmitter()

        this.registerQueueWorkers()

        /**
         * Configure dotenv
         */
        if (this.config.dotenv) this.registerDotEnv()

        this.registerModelsIntoContainer()

        this.registerBillingProvider()

        this.registerServices()

        this.registerNotificationChannels()

        return this
    }

    /**
     *
     * Initialize the express application
     * First try to connect to the database
     * If it fails, gracefully shut down
     *
     * @return Express.Application
     */
    init() {
        this.registerEventEmitter()

        /**
         * Configure dotenv
         */
        if (this.config.dotenv) this.registerDotEnv()

        /**
         * Configure pino logger
         */
        if (this.config.pino) this.registerPinoLogger()

        this.registerQueueWorkers()

        return (
            this.establishDatabaseConnection()

                /**
                 * If a successful database connection is established,
                 *
                 */
                .then(() => {
                    /**
                     * Register all mongoose models into container
                     */
                    this.registerModelsIntoContainer()

                    this.registerBillingProvider()

                    this.registerServices()

                    this.registerNotificationChannels()

                    this.registerRegistrationEventListeners()

                    this.registerPasswordResetEventListener()

                    this.extendIndicative()

                    this.registerResponseHelpers()

                    /**
                     * Configure body parser
                     */
                    if (this.config.bodyParser) this.registerBodyParser()

                    /**
                     * Disable x-powered-by
                     */
                    if (this.config.disableXPoweredByHeader)
                        this.disableXPoweredByHeader()

                    /**
                     * Configure Cors
                     */
                    if (this.config.cors) this.registerCors()

                    this.registerAuthRoutes()

                    this.registerSubscriptionRoutes()

                    return this.app
                })

                .catch(e => {
                    console.log(e)
                    // TODO: Gracefully shut down the system
                    // maybe send a notification that things are broken.
                    return Promise.reject(e)
                })
        )
    }
}

module.exports = Kopter
