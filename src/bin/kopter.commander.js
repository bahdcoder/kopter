#!/usr/bin/env node

const program = require('commander')

program
    .version(require('../../package.json').version)
    .description('CLI for kopter')

program

    /**
     * This command starts all queue workers defined in the kopter configuration.
     */
    .command('workers')
    .description('Start all queue workers defined in the kopter configuration.')
    .action(require('./commands/workers'))

program

    /**
     *
     * This command generates a new kopter project with all the kopter goodness !!!
     */
    .command('init')
    .description('Generate a new kopter project.')
    .arguments('<project-directory>')
    .action(require('./commands/init'))

program.parse(process.argv)
