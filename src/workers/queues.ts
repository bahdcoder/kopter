import Container from 'typedi'
import { Kopter } from '../Kopter'
import { MAIL_SERVICE } from '../utils/constants'
import { MailService } from '../services/mail.service'

/**
 * This is a temporal way of setting up queue workers with the whole application context
 */
new Kopter(undefined, {
    mail: {
        connection: 'ethereal',
        viewEngine: 'handlebars',
        views: 'src/mails',
        ethereal: {
            driver: 'ethereal'
        }
    }
}).initConsole()

const Queue: any = Container.get('mails.queue')

Queue.process((job: any, done: Function) => {
    try {
        const {
            mailName,
            subject,
            customMailConfig,
            recipients,
            data
        } = job.data
        ;(Container.get(MAIL_SERVICE) as MailService)
            .build(mailName, customMailConfig)
            .to(recipients)
            .data({ user: data })
            .subject(subject)
            .send()
            .then(done)
            .catch(console.log)
    } catch (e) {
        console.error(e)
    }
})

console.log('###### Mails Queue worker started ! ######')
