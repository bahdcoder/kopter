import Fs from 'fs'
import Path from 'path'
import Bull from 'bull'
import Cors from 'cors'
import 'reflect-metadata'
import Omit from 'object.omit'
import Container from 'typedi'
import Mongoose from 'mongoose'
import DeepMerge from 'deepmerge'
import * as Express from 'express'
import BodyParser from 'body-parser'
import { getValue } from 'indicative-utils'
import PinoLogger from 'express-pino-logger'
import { extend } from 'indicative/validator'
import { EventEmitter2 } from 'eventemitter2'
import { asyncRequest } from './utils/async-request'
import Dotenv, { DotenvConfigOptions } from 'dotenv'

import { UserSchema } from './models/user.model'
import { StatusCodes } from './utils/status-codes'
import { UserService } from './services/user.service'
import { MailService } from './services/mail.service'
import { LoginController } from './controllers/login.controller'
import { RegisterController } from './controllers/register.controller'
import {
    EVENT_DISPATCHER,
    X_POWERED_BY,
    USER_MODEL,
    USER_SERVICE,
    MAIL_SERVICE,
    USER_REGISTERED
} from './utils/constants'

export interface MailOptions {
    connection: string | undefined
    views: string | undefined
    viewEngine: string
    [key: string]: any
}

export interface KopterConfig {
    bodyParser?: BodyParser.OptionsJson | undefined | Boolean
    pino?: PinoLogger.Options | undefined | Boolean
    dotenv?: Dotenv.DotenvConfigOptions | undefined | Boolean
    disableXPoweredByHeader?: Boolean
    cors?: Cors.CorsOptions | undefined | Boolean
    mongoose?: Mongoose.ConnectionOptions
    UserSchema?: Mongoose.Schema
    UserService?: any
    MailService?: any
    mail?: MailOptions
    disableRegistrationEventListeners?: boolean | undefined
    queue?: any
}

export class Kopter {
    /**
     *
     * The express instance
     */
    app: Express.Application | undefined

    /**
     * The default kopter configuration
     */
    config: KopterConfig = {
        bodyParser: {},
        pino: {},
        dotenv: {},
        cors: {},
        UserSchema,
        UserService,
        MailService,
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
        queue: {
            workers: [
                {
                    name: 'mails.queue',
                    options: {},
                    handler() {
                        console.log('############# MAGIC HAPPENING HERE')
                    }
                }
            ]
        }
    }

    constructor(
        app?: Express.Application | undefined,
        config: KopterConfig = {}
    ) {
        this.app = app

        const plainConfig = Omit(config, [
            'UserSchema',
            'UserService',
            'MailService'
        ])
        const plainDefaultConfig = Omit(this.config, [
            'UserSchema',
            'UserService',
            'MailService'
        ])

        /**
         * Merge the config with the default one.
         */
        this.config = {
            UserSchema: config.UserSchema || this.config.UserSchema,
            UserService: config.UserService || this.config.UserService,
            MailService: config.MailService || this.config.MailService,
            ...DeepMerge(plainDefaultConfig, plainConfig)
        }
    }

    /**
     * Registers the body-parser middleware
     */
    public registerBodyParser(): void {
        ;(this.app as Express.Application).use(
            BodyParser.json(
                (this.config.bodyParser as BodyParser.OptionsJson) || {}
            )
        )
    }

    /**
     * Disable x-powered-by header added by default in express
     */
    public disableXPoweredByHeader(): void {
        ;(this.app as Express.Application).disable(X_POWERED_BY)
    }

    public registerQueueWorkers(): void {
        this.config.queue.workers.forEach((worker: any) => {
            Container.set(worker.name, new Bull(worker.name))
        })
    }

    /**
     * Registers the pino logger middleware
     */
    public registerPinoLogger(): void {
        ;(this.app as Express.Application).use(
            PinoLogger((this.config.pino as PinoLogger.Options) || {})
        )
    }

    public registerEventEmitter(): void {
        Container.set(EVENT_DISPATCHER, new EventEmitter2({}))
    }

    /**
     * Register the dotenv package
     */
    public registerDotEnv(): void {
        Dotenv.config((this.config.dotenv as DotenvConfigOptions) || {})
    }

    /**
     * Register the cors package
     */
    public registerCors(): void {
        ;(this.app as Express.Application).use(
            Cors(this.config.cors as Cors.CorsOptions)
        )
    }

    /**
     * Fetches all models and registers them into DI container
     */
    public registerModelsIntoContainer(): void {
        Container.set(
            USER_MODEL,
            Mongoose.model('User', this.config.UserSchema)
        )
    }

    public registerServices(): void {
        Container.set(
            USER_SERVICE,
            new this.config.UserService(Container.get(USER_MODEL))
        )

        Container.set(
            MAIL_SERVICE,
            new this.config.MailService(this.config.mail)
        )
    }

    public registerRegistrationEventListeners() {
        if (this.config.disableRegistrationEventListeners) return

        const config = this.config.mail as MailOptions
        ;(Container.get(EVENT_DISPATCHER) as EventEmitter2).on(
            USER_REGISTERED,
            async (user: any) => {
                const mailName = 'confirm-email'
                // check if the user has created a confirm-email mail in their
                // configured views folder
                const mailFolder: string = ((process.cwd() as string) +
                    config.views) as string

                const customMailConfig: any = {}

                if (!Fs.existsSync(`${mailFolder}/${mailName}`)) {
                    customMailConfig.useCustomMailPaths = true

                    customMailConfig.views = Path.resolve(__dirname, 'mails')
                }

                // if they have, then use that
                // if not, then use the default in the mails folder
                ;(Container.get('mails.queue') as any).add({
                    data: user,
                    mailName,
                    customMailConfig,
                    subject: 'Welcome to Kopter !!!',
                    recipients: user.email
                })
            }
        )
    }

    /**
     * Connects to mongoose or gracefully shuts down
     */
    public establishDataseConnection() {
        return Mongoose.connect(
            process.env.MONGODB_URL as string,
            this.config.mongoose
        )
    }

    public getAuthRouter() {
        const router = Express.Router()
        ;(this.app as Express.Application).use('/auth', router)

        return router
    }

    public extendIndicative() {
        extend('unique', {
            async: true,

            validate: (data: any, field, args, config) =>
                (Container.get(USER_MODEL) as any)
                    .findOne({ [field]: getValue(data, field) })
                    .then((user: any) => (user ? false : true))
                    .catch(() => false)
        })
    }

    public registerResponseHelpers() {
        ;(this.app as Express.Application).use(
            (
                request: Express.Request,
                response: Express.Response,
                next: Express.NextFunction
            ) => {
                Object.keys(StatusCodes).forEach((status: string) => {
                    const statusCode = StatusCodes[status]
                    // @ts-ignore
                    response[status] = (data: string | Array<any> | Object) =>
                        response.status(statusCode).json({
                            code: status,
                            data
                        })
                })
                next()
            }
        )
    }

    public registerRoutes(): void {
        const router = this.getAuthRouter()

        router.post(
            '/register',
            asyncRequest(Container.get(RegisterController).register)
        )

        router.post(
            '/login',
            asyncRequest(Container.get(LoginController).login)
        )
    }

    public initConsole(): any {
        this.registerEventEmitter()

        this.registerQueueWorkers()

        /**
         * Configure dotenv
         */
        if (this.config.dotenv) this.registerDotEnv()

        this.registerModelsIntoContainer()

        this.registerServices()

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
    public init(): Promise<Express.Application | void> {
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
            this.establishDataseConnection()

                /**
                 * If a successful database connection is established,
                 *
                 */
                .then(() => {
                    /**
                     * Register all mongoose models into container
                     */
                    this.registerModelsIntoContainer()

                    this.registerServices()

                    this.registerRegistrationEventListeners()

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

                    this.registerRoutes()

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
