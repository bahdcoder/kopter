import Container from 'typedi'
import { Kopter } from '../Kopter'
import { MAIL_SERVICE } from '../utils/constants'
import { MailService } from '../services/mail.service'

const kopter = new Kopter(undefined, {
    mail: {
        connection: 'ethereal',
        viewEngine: 'handlebars',
        views: 'src/mails',
        ethereal: {
            driver: 'ethereal'
        }
    }
}).initConsole()

kopter.config.queue.workers.forEach((worker: any) => {
    const Queue: any = Container.get(worker.name)

    Queue.process((job: any, done: Function) => {
        try {
            const {
                mailName,
                subject,
                customMailConfig,
                recipients,
                data
            } = job.data
            console.log(
                '----------------------------->',
                (Container.get(MAIL_SERVICE) as MailService).build(
                    mailName,
                    customMailConfig
                )
            )
            ;(Container.get(MAIL_SERVICE) as MailService)
                .build(mailName, customMailConfig)
                .to(recipients)
                .data({ user: data })
                .subject(subject)
                .send()
                .then((result: any) => {
                    console.log('xxxxxxxxxxxxxx', result)

                    done()
                })
                .catch(() => {
                    console.log('>>>>>>>>>>>>>>>>>> JOB FAILED')
                })
        } catch (e) {
            console.log('xx-----xxx', e)
        }
    })
})

console.log('###### Queue worker started ! ######')
