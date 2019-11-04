const Path = require('path')
const Fs = require('fs-extra')

try {
    const folders = Fs.readdirSync(Path.resolve(__dirname, '..', 'mails'))

    folders.forEach(folder => {
        const files = Fs.readdirSync(
            Path.resolve(__dirname, '..', 'mails', folder)
        )

        Fs.mkdirSync(
            Path.resolve(__dirname, '..', '..', 'dist', 'mails', folder)
        )

        files.forEach(file => {
            Fs.copySync(
                Path.resolve(__dirname, '..', 'mails', folder, file),
                Path.resolve(
                    __dirname,
                    '..',
                    '..',
                    'dist',
                    'mails',
                    folder,
                    file
                )
            )
        })
    })
} catch (e) {}
