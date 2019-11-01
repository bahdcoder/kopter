import Express from 'express'
import { Kopter, Container } from 'kopter'

const app = new Kopter(Express(), {
    pino: false
}).init()

const PORT = 5000

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
