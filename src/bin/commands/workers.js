const Kopter = require('../../Kopter')
const { Container } = require('typedi')
const Consola = require('consola')

module.exports = command => {
    const kopter = new Kopter().initConsole()

    kopter.config.queue.workers.forEach(worker => {
        const BullInstance = Container.get(worker.name)

        Consola.success(`Worker ${worker.name} started successfully.`)

        BullInstance.process((job, done) => {
            worker.handler({
                job,
                done,
                Container
            })
        })
    })
}
