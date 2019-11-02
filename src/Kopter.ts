import Cors from 'cors'
import 'reflect-metadata'
import Container from 'typedi'
import Mongoose from 'mongoose'
import * as Express from 'express'
import BodyParser from 'body-parser'
import PinoLogger from 'express-pino-logger'
import Dotenv, { DotenvConfigOptions } from 'dotenv'

import { UserSchema } from './models/user.model'
import { RegisterController } from './controllers/register.controller'

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
        this.app.disable('x-powered-by')
    }

    /**
     * Registers the pino logger middleware
     */
    public registerPinoLogger(): void {
        this.app.use(PinoLogger((this.config.pino as PinoLogger.Options) || {}))
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
        const UserModel = Mongoose.model('User', this.config.UserSchema)

        Container.set('user.model', UserModel)
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

    public registerRoutes(): void {
        const router = this.getAuthRouter()

        router.post('/register', Container.get(RegisterController).register)
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

                    this.registerRoutes()

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
