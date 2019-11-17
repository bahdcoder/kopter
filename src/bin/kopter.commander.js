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

program.parse(process.argv)
