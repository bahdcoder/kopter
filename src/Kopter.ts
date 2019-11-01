import * as Express from 'express'
import BodyParser from 'body-parser'
import PinoLogger from 'express-pino-logger'
import Dotenv, { DotenvConfigOptions } from 'dotenv'

export interface KopterConfig {
    bodyParser?: BodyParser.OptionsJson | undefined | Boolean
    pino?: PinoLogger.Options | undefined | Boolean
    dotenv?: Dotenv.DotenvConfigOptions | undefined | Boolean
    disableXPoweredByHeader?: Boolean
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
        disableXPoweredByHeader: true
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
     *
     * Initialize the express application
     *
     * @return Express.Application
     */
    public init(): Express.Application {
        /**
         * Configure dotenv
         */
        if (this.config.dotenv) this.registerDotEnv()

        /**
         * Configure body parser
         */
        if (this.config.bodyParser) this.registerBodyParser()

        /**
         * Configure pino logger
         */
        if (this.config.pino) this.registerPinoLogger()

        /**
         * Disable x-powered-by
         */
        if (this.config.disableXPoweredByHeader) this.disableXPoweredByHeader()

        return this.app
    }
}
