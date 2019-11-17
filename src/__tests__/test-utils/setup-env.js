module.exports = () => {
    process.env.JWT_SECRET = 'shhh'
    process.env.STRIPE_API_KEY = 'sk_test_BbvXhW3mzZBf52YzR1ihwlqU'
    process.env.MONGODB_URL = 'mongodb://localhost:27017/kopter-test'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_RMA5R0RsvmJfSRQjbsv0rwiRJKhXJ7Ne'
}
