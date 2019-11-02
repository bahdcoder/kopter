import Cors from 'cors'
import 'reflect-metadata'
import Container from 'typedi'
import Mongoose from 'mongoose'
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
import { RegisterController } from './controllers/register.controller'
import { EVENT_DISPATCHER, X_POWERED_BY, USER_MODEL } from './utils/constants'

export interface KopterConfig {
    bodyParser?: BodyParser.OptionsJson | undefined | Boolean
    pino?: PinoLogger.Options | undefined | Boolean
    dotenv?: Dotenv.DotenvConfigOptions | undefined | Boolean
    disableXPoweredByHeader?: Boolean
    cors?: Cors.CorsOptions | undefined | Boolean
    mongoose?: Mongoose.ConnectionOptions
    UserSchema?: Mongoose.Schema
}

export class Kopter {
    /**
     *
     * The express instance
     */
    app: Express.Application

    /**
     * The default kopter configuration
     */
    config: KopterConfig = {
        bodyParser: {},
        pino: {},
        dotenv: {},
        cors: {},
        UserSchema,
        disableXPoweredByHeader: true,
        mongoose: {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    }

    constructor(app: Express.Application, config?: KopterConfig) {
        this.app = app

        /**
         * Merge the config with the default one.
         */
        this.config = Object.assign(this.config, config || {})
    }

    /**
     * Registers the body-parser middleware
     */
    public registerBodyParser(): void {
        this.app.use(
            BodyParser.json(
                (this.config.bodyParser as BodyParser.OptionsJson) || {}
            )
        )
    }

    /**
     * Disable x-powered-by header added by default in express
     */
    public disableXPoweredByHeader(): void {
        this.app.disable(X_POWERED_BY)
    }

    /**
     * Registers the pino logger middleware
     */
    public registerPinoLogger(): void {
        this.app.use(PinoLogger((this.config.pino as PinoLogger.Options) || {}))
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
        this.app.use(Cors(this.config.cors as Cors.CorsOptions))
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

        this.app.use('/auth', router)

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
        this.app.use(
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
