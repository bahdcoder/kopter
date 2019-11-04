module.exports = {
    connection: process.env.MAIL_CONNECTION || 'ethereal',
    views: 'mails',
    viewEngine: 'handlebars',
    ethereal: {
        driver: 'ethereal'
    }
}
