import Express from 'express'

export const asyncRequest = (handler: Function) => (
    request: Express.Request,
    response: Express.Response
) => handler(request, response).catch((e: any) => response.badRequest(e))
