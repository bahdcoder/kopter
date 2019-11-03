import Express from 'express'

export const asyncRequest = (handler: Function) => (
    request: Express.Request,
    response: Express.Response
) =>
    handler(request, response).catch((e: any) => {
        if (e instanceof Error) return response.badRequest(e.message)

        return response.badRequest(e)
    })
