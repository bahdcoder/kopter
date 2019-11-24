const Fs = require('fs')
const Path = require('path')
const Chalk = require('chalk')
const Edge = require('edge.js')
const Consola = require('consola')
const RandomString = require('randomstring')
const { execSync } = require('child_process')
const ValidateNpmPackageName = require('validate-npm-package-name')

module.exports = (projectName, command) => {
    const currentNodeVersion = process.versions.node.split('.')[0]

    if (currentNodeVersion < 8)
        return Consola.error(
            `You are running node version ${currentNodeVersion}. Kopter requires v8 or higher. Please update your version of node.`
        )

    const root = Path.resolve(projectName)
    const appName = Path.basename(root)

    // Validate the project name passed
    checkProjectName(appName)

    // check if folder exists
    checkProjectFolder(root, appName)

    Consola.info(
        `Generating a new kopter application into the ${projectName} folder.`
    )

    // create project folder
    createProjectFolders(root, appName)

    // create files for backend project
    createBackendFiles(root, appName)

    Consola.success(`Server generated successfully.`)
    Consola.info(`Installing project dependencies with npm.`)

    // run npm install in the backend folder
    execSync(`cd ${root}/server && npm install`, { stdio: false })
}

const createBackendFiles = (root, appName) => {
    // copy the .env file
    copyAndRenderBackendFile(root, '.env', {
        databaseName: appName,
        jwtSecret: RandomString.generate({ length: 72 })
    })

    // copy the package.json file
    copyAndRenderBackendFile(root, 'package.json', {
        appName,
        kopterVersion: JSON.parse(
            Fs.readFileSync(
                Path.resolve(__dirname, '..', '..', '..', 'package.json')
            ).toString()
        ).version
    })

    // copy the gitignore file
    copyAndRenderBackendFile(root, '.gitignore')

    // copy the app.js file
    copyAndRenderBackendFile(root, 'app.js')

    // copy the kopter.config.js
    copyAndRenderBackendFile(root, 'kopter.config.js')
}

const copyAndRenderBackendFile = (root, fileName, data = {}) => {
    Fs.writeFileSync(
        `${root}/server/${fileName}`,
        Edge.renderString(
            Fs.readFileSync(
                Path.resolve(__dirname, '..', 'templates', 'server', fileName)
            ).toString(),
            data
        )
    )
}

const createProjectFolders = (root, appName) => {
    // create the project folder
    Fs.mkdirSync(root, {
        recursive: true
    })

    // create the backend folder
    Fs.mkdirSync(`${root}/server`, {
        recursive: true
    })

    // create the folder for the frontend project
    Fs.mkdirSync(`${root}/client`, {
        recursive: true
    })
}

const checkProjectName = appName => {
    const validationResult = ValidateNpmPackageName(appName)

    if (!validationResult.validForNewPackages) {
        Consola.info(
            `Could not create project called ${appName} because of npm naming restrictions:`
        )
        validationResult.errors &&
            validationResult.errors.forEach(error => Consola.error(error))
        validationResult.warnings &&
            validationResult.warnings.forEach(warning => Consola.warn(warning))
        process.exit(1)
    }

    if (['kopter'].includes(appName)) {
        Consola.error(
            `Could not create project called ${appName} because an npm dependency already exists with this name.`
        )

        process.exit(1)
    }
}

const checkProjectFolder = (folderPath, appName) => {
    if (Fs.existsSync(folderPath)) {
        Consola.error(
            `Could not create project called ${appName} because folder ${appName} already exists.`
        )

        process.exit(1)
    }
}
