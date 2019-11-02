declare module 'validator'

declare namespace Express {
    export interface Response {
        continue: (message?: string) => any
        switchingProtocols: (message?: string) => any
        ok: (message?: string) => any
        created: (message?: string) => any
        accepted: (message?: string) => any
        nonAuthoritativeInformation: (message?: string) => any
        noContent: (message?: string) => any
        resetContent: (message?: string) => any
        partialContent: (message?: string) => any
        multipleChoices: (message?: string) => any
        movedPermanently: (message?: string) => any
        found: (message?: string) => any
        seeOther: (message?: string) => any
        notModified: (message?: string) => any
        useProxy: (message?: string) => any
        temporaryRedirect: (message?: string) => any
        badRequest: (message?: string) => any
        unauthorized: (message?: string) => any
        paymentRequired: (message?: string) => any
        forbidden: (message?: string) => any
        notFound: (message?: string) => any
        methodNotAllowed: (message?: string) => any
        notAcceptable: (message?: string) => any
        proxyAuthenticationRequired: (message?: string) => any
        requestTimeout: (message?: string) => any
        conflict: (message?: string) => any
        gone: (message?: string) => any
        lengthRequired: (message?: string) => any
        preconditionFailed: (message?: string) => any
        requestEntityTooLarge: (message?: string) => any
        requestUriTooLong: (message?: string) => any
        unsupportedMediaType: (message?: string) => any
        requestedRangeNotSatisfiable: (message?: string) => any
        expectationFailed: (message?: string) => any
        unprocessableEntity: (message?: string) => any
        tooManyRequests: (message?: string) => any
        internalServerError: (message?: string) => any
        notImplemented: (message?: string) => any
        badGateway: (message?: string) => any
        serviceUnavailable: (message?: string) => any
        gatewayTimeout: (message?: string) => any
        httpVersionNotSupported: (message?: string) => any
    }
}
