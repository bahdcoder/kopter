import Express from 'express'
import { Kopter, Container } from 'kopter'

import UserSchema from './models/user.model'

new Kopter(Express(), {
    UserSchema,
    pino: false
})
    .init()
    .then(app => {
        const PORT = 5000

        // console.log(Container.get('user.model').schema.paths)

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`)
        })
    })
