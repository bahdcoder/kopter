const Kopter = require('../Kopter')
const { Container } = require('typedi')

const kopter = new Kopter().initConsole()

kopter.config.queue.workers.forEach(worker => {
    const BullInstance = Container.get(worker.name)

    BullInstance.process((job, done) => {
        worker.handler({
            job,
            done,
            Container
        })
    })
})
