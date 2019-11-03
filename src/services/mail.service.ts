import Mail from 'friendly-mail'

export class MailService {
    constructor(private MailerConfig: any) {}

    /**
     * Send a mail
     * @param mailName string
     *
     * @param customConfig with this we can override MailerConfig
     */
    public build(mailName: string, customConfig: any = {}) {
        return new Mail(mailName, {
            ...this.MailerConfig,
            ...customConfig
        })
    }
}
