const { Kopter } = require('kopter')

;(async () => {
    const { app } = await new Kopter().init()

    const port = process.env.PORT

    app.listen(port, () =>
        console.log('✅ Server running on http://localhost', port)
    )
})()
