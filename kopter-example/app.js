import { Kopter } from 'kopter'

new Kopter().init().then(app => {
    const PORT = 5000

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`)
    })
})
