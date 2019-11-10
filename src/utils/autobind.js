module.exports = (Class, Instance) => {
    Object.getOwnPropertyNames(Class.prototype).forEach(functionName => {
        Instance[functionName] = Instance[functionName].bind(Instance)
    })
}
