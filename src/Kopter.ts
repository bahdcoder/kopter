import * as Express from 'express'
import BodyParser from 'body-parser'
import PinoLogger from 'express-pino-logger'

export interface KopterConfig {
    bodyParser?: BodyParser.OptionsJson | undefined | Boolean
    pino?: PinoLogger.Options | undefined | Boolean
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
        pino: {}
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
     * Registers the pino logger middleware
     */
    public registerPinoLogger(): void {
        this.app.use(PinoLogger((this.config.pino as PinoLogger.Options) || {}))
    }

    /**
     *
     * Initialize the express application
     *
     * @return Express.Application
     */
    public init(): Express.Application {
        /**
         * Configure body parser
         */
        if (this.config.bodyParser) this.registerBodyParser()

        /**
         * Configure pino logger
         */
        if (this.config.pino) this.registerPinoLogger()

        return this.app
    }
}
