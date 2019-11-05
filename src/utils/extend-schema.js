const Mongoose = require('mongoose')

module.exports = (Schema, definition, options) =>
    new Mongoose.Schema(Object.assign({}, Schema.obj, definition), options)
