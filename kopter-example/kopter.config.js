module.exports = {
    /*
    |--------------------------------------------------------------------------
    | BodyParser configuration
    |--------------------------------------------------------------------------
    |
    | This configuration can be used to configure the body parser express 
    | middleware. This object takes in a list of all accepted body par-
    | ser options. To disable body parser completely, change this
    | configuration value to false.
    | 
    |
    | All valid body parser configuration values can be found here:
    |
    | https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/body-parser/index.d.ts#L30
    |
    */
    bodyParser: {},

    /*
    |--------------------------------------------------------------------------
    | Pino configuration
    |--------------------------------------------------------------------------
    |
    | The application registers the pino logger by default. This configuration
    | takes in a list of configurations accepted by the express pino logger.
    | To disable pino logger, set this value to false.
    |
    |  Pino logger documentation:
    |
    | https://getpino.io/#/
    |
    */
    pino: {},

    /*
    |--------------------------------------------------------------------------
    | Dotenv configuration
    |--------------------------------------------------------------------------
    |
    | The application configures the dotenv file to automatically set env 
    | variables from a file named .env at the root of your project.
    | To disable the dotenv package, set this value to false.
    | 
    | Dotenv package documentation:
    |
    | https://www.npmjs.com/package/dotenv
    |
    */
    dotenv: {},

    /*
    |--------------------------------------------------------------------------
    | Cors configuration
    |--------------------------------------------------------------------------
    |
    | The application configures and enables the express cors package . You 
    | can pass all cors configuration options using this configuration.
    | If you want to completely disable this middleware, set this
    | value to false.
    |
    | Cors package documentation:
    |
    | https://www.npmjs.com/package/cors
    |
    */
    cors: {},

    /*
    |--------------------------------------------------------------------------
    | Disable x-powered-by Header
    |--------------------------------------------------------------------------
    |
    | Remove the powered by express header from your API responses
    |
    */
    disableXPoweredByHeader: true,

    /*
    |--------------------------------------------------------------------------
    | Mongoose connection
    |--------------------------------------------------------------------------
    |
    | This defines options for connecting to mongoose. By default, the options
    | are: { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true }
    | Changing these options override the default.
    | 
    */
    mongoose: null,

    /*
    |--------------------------------------------------------------------------
    | Mail configuration
    |--------------------------------------------------------------------------
    |
    | This defines options for the friendly-mail package used for sending
    | emails in the application.
    |
    | Link to friendly-mail package docs:
    |
    | https://github.com/bahdcoder/friendly-mail
    | 
    */
    mail: {
        /** This defines the folder where all your mails are stored */
        views: 'mails',

        /** This defines the channel/connection used for sending mails */
        connection: 'ethereal',

        /** This defines the templating engine used for composing mails. */
        viewEngine: 'handlebars',

        /** This defines the options for the configured connection */
        ethereal: {
            driver: 'ethereal'
        }
    },

    /** Mongoose Schemas */

    /*
    |--------------------------------------------------------------------------
    | UserSchema
    |--------------------------------------------------------------------------
    |
    | You can extend the default UserSchema created by kopter. By default, 
    | this configuration is set to null. To override, set this config-
    | uration value to your custom UserSchema.
    |
    | Example configuration:
    | 
    | UserSchema: require('./models/user.schema')
    |
    */
    UserSchema: null,

    /*
    |--------------------------------------------------------------------------
    | PasswordResetSchema
    |--------------------------------------------------------------------------
    |
    | You can extend the default PasswordResetSchema created by kopter.
    | By default, this configuration is set to null. To override,
    | extend the default schema and pass it into this config.
    |
    | Example configuration:
    | 
    | PasswordResetSchema: require('./models/password.resets.schema')
    |
    */
    PasswordResetSchema: null,

    /*
    |--------------------------------------------------------------------------
    | NotificationSchema
    |--------------------------------------------------------------------------
    |
    | You can extend the default NotificationSchema created by kopter.
    | By default, this configuration is set to null. To override,
    | extend the default schema and pass it into this config.
    |
    | Example configuration:
    | 
    | NotificationSchema: require('./models/notification.model')
    |
    */
    NotificationSchema: null,

    /** Kopter Services */

    /*
    |--------------------------------------------------------------------------
    | UserService
    |--------------------------------------------------------------------------
    |
    | You can extend the default UserService created by kopter. This service
    | contains methods in charge of creating users, generating jwt, comp-
    | aring passwords, serializing users and so much more. You can ex-
    | tend this service and customize some of these methods.
    |
    | Example configuration:
    | 
    | UserSchema: require('./services/user.service')
    |
    */
    UserService: null,

    /*
    |--------------------------------------------------------------------------
    | MailService
    |--------------------------------------------------------------------------
    |
    | You can extend the default MailService created by kopter. This service
    | contains methods in charge of sending mails to users. You can exte-
    | nd and override methods in the default MailService class.
    |
    | Example configuration:
    | 
    | MailService: require('./services/mail.service')
    |
    */
    MailService: null,

    /*
    |--------------------------------------------------------------------------
    | PasswordResetService
    |--------------------------------------------------------------------------
    |
    | You can extend the default PasswordResetService created by kopter.
    | This service contains methods in charge of forgot password and
    | password resets. You can extend and override some of these. 
    |
    | Example configuration:
    | 
    | PasswordResetservice: require('./services/password.reset.service')
    |
    */
    PasswordResetService: null,

    /*
    |--------------------------------------------------------------------------
    | BillingService
    |--------------------------------------------------------------------------
    |
    | You can extend the default BillingService created by kopter.
    | This service contains methods that interact with the
    | configured billing provider to manage billing.
    |
    | Example configuration:
    | 
    | BillingService: require('./services/billing.service')
    |
    */
    BillingService: null,

    /** Queue workers */

    /*
    |--------------------------------------------------------------------------
    | Queue workers
    |--------------------------------------------------------------------------
    |
    | Define an array of queue workers. Each worker will instantiate a new
    | Bull.Js instance.
    |
    |
    */
    queue: {
        workers: [
            {
                /** The name of the queue. Is the name of the bull queue  */
                name: 'mails.queue',

                /** The options passed to the Bull.Js instance  */
                options: {},

                /** This method processes jobs on this queue. It'll receive the queue job, the done callback from bull, and the kopter container */
                handler: async ({ job: { data }, done, Container }) => {
                    await Container.get('mail.service')
                        .build(data.mailName, data.customMailConfig)
                        .subject(data.subject)
                        .data({ user: data.data })
                        .to([data.recipients])
                        .send()

                    done()
                }
            }
        ]
    }
}
