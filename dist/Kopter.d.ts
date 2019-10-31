import * as Express from 'express';
export declare class Kopter {
    /**
     *
     * The express instance
     */
    app: Express.Application;
    constructor(app: Express.Application);
    /**
     *
     * Initialize the express application
     *
     * @return Express.Application
     */
    init(): Express.Application;
}
