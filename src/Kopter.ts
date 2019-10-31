import * as Express from 'express'

export class Kopter {
    /**
     * 
     * The express instance
     */
    app: Express.Application

    constructor(app: Express.Application) {
        this.app = app
    }

    /**
     * 
     * Initialize the express application
     * 
     * @return Express.Application
     */
    public init (): Express.Application {
        return this.app
    }
}
