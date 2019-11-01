import Express from 'express'
import { Kopter } from 'kopter'

const app = new Kopter(Express()).init()
const PORT = 5000
app.listen(PORT, () => {
    console.log(`server listenign on port ${PORT}`)
})
