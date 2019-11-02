module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    moduleNameMapper: {
        '^@/(.*)': '<rootDir>/src/$1'
    }
}
