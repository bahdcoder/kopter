declare module 'validator'

declare namespace Express {
    export interface Request {
        authUser?: any
    }
    export interface Response {
        continue: (data?: string | Array<any> | Object) => any
        switchingProtocols: (data?: string | Array<any> | Object) => any
        ok: (data?: string | Array<any> | Object) => any
        created: (data?: string | Array<any> | Object) => any
        accepted: (data?: string | Array<any> | Object) => any
        nonAuthoritativeInformation: (
            data?: string | Array<any> | Object
        ) => any
        noContent: (data?: string | Array<any> | Object) => any
        resetContent: (data?: string | Array<any> | Object) => any
        partialContent: (data?: string | Array<any> | Object) => any
        multipleChoices: (data?: string | Array<any> | Object) => any
        movedPermanently: (data?: string | Array<any> | Object) => any
        found: (data?: string | Array<any> | Object) => any
        seeOther: (data?: string | Array<any> | Object) => any
        notModified: (data?: string | Array<any> | Object) => any
        useProxy: (message?: string) => any
        temporaryRedirect: (data?: string | Array<any> | Object) => any
        badRequest: (data?: string | Array<any> | Object) => any
        unauthorized: (data?: string | Array<any> | Object) => any
        paymentRequired: (data?: string | Array<any> | Object) => any
        forbidden: (data?: string | Array<any> | Object) => any
        notFound: (data?: string | Array<any> | Object) => any
        methodNotAllowed: (data?: string | Array<any> | Object) => any
        notAcceptable: (data?: string | Array<any> | Object) => any
        proxyAuthenticationRequired: (
            data?: string | Array<any> | Object
        ) => any
        requestTimeout: (data?: string | Array<any> | Object) => any
        conflict: (data?: string | Array<any> | Object) => any
        gone: (data?: string | Array<any> | Object) => any
        lengthRequired: (data?: string | Array<any> | Object) => any
        preconditionFailed: (data?: string | Array<any> | Object) => any
        requestEntityTooLarge: (data?: string | Array<any> | Object) => any
        requestUriTooLong: (mdata?: string | Array<any> | Object) => any
        unsupportedMediaType: (data?: string | Array<any> | Object) => any
        requestedRangeNotSatisfiable: (
            data?: string | Array<any> | Object
        ) => any
        expectationFailed: (data?: string | Array<any> | Object) => any
        unprocessableEntity: (data?: string | Array<any> | Object) => any
        tooManyRequests: (data?: string | Array<any> | Object) => any
        internalServerError: (data?: string | Array<any> | Object) => any
        notImplemented: (data?: string | Array<any> | Object) => any
        badGateway: (data?: string | Array<any> | Object) => any
        serviceUnavailable: (data?: string | Array<any> | Object) => any
        gatewayTimeout: (data?: string | Array<any> | Object) => any
        httpVersionNotSupported: (data?: string | Array<any> | Object) => any
    }
}
