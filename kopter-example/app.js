import Express from 'express'
import { Kopter, Container, EVENT_DISPATCHER, USER_REGISTERED } from 'kopter'

import UserSchema from './models/user.model'

new Kopter(Express(), {
    UserSchema,
    pino: false
})
    .init()
    .then(app => {
        const PORT = 5000

        Container.get(EVENT_DISPATCHER).on(USER_REGISTERED, user => {
            console.log(
                '#######################################################',
                user
            )
        })

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`)
        })
    })
