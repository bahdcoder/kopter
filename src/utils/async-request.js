module.exports = handler => (request, response) =>
    handler(request, response).catch(error => {
        console.log('---------------------------------------------->', error)
        if (error instanceof Error) return response.badRequest(error.message)

        return response.badRequest(error)
    })
