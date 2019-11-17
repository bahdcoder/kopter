const Stripe = require('stripe')
const Consola = require('consola')
const { Container } = require('typedi')
const ChangeCase = require('change-case')
const autobind = require('../utils/autobind')
const fromUnixTime = require('date-fns/fromUnixTime')
const { SUBSCRIPTION_MODEL } = require('../utils/constants')

class StripeWebhooksController {
    constructor() {
        autobind(StripeWebhooksController, this)

        if (!process.env.STRIPE_API_KEY) {
            Consola.warn(
                `Don't forgegt to setup your STRIPE_API_KEY env variable.`
            )
        }

        this.stripe = Stripe(process.env.STRIPE_API_KEY)
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        this.SubscriptionModel = Container.get(SUBSCRIPTION_MODEL)

        if (!this.webhookSecret) {
            Consola.warn(
                `Don't forget to setup your STRIPE_WEBHOOK_SECRET env variable. This is required for stripe webhooks to work properly.`
            )
        }
    }

    /**
     * Handle multiple incoming stripe webhooks
     */
    async handle(request, response) {
        const event = await this.checkWebhookSignature(request)

        const eventType = event.type

        const methodHandler = this.getMethodHandler(eventType)

        if (this[methodHandler]) await this[methodHandler](event)

        return response.ok({ received: true })
    }

    async handleInvoicePaymentSucceeded(event) {
        const invoice = event.data.object

        // const subscription = await this.SubscriptionModel.findOne({})
    }

    async handleCustomerSubscriptionUpdated(event) {
        const stripeSubscription = event.data.object

        // find the matching subscription from our database
        const subscription = await this.SubscriptionModel.findOne({
            _id: stripeSubscription.id
        })

        if (!subscription) return

        subscription.status = stripeSubscription.status
        subscription.quantity = stripeSubscription.quantity
        subscription.trialEnd = stripeSubscription.trial_end
        subscription.currentPeriodEnd = fromUnixTime(
            stripeSubscription.current_period_end
        )
        subscription.currentPeriodStart = fromUnixTime(
            stripeSubscription.current_period_start
        )
        subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end

        await subscription.save()
    }

    getMethodHandler(eventType) {
        const [objectName, eventName] = eventType.split('.')

        return `handle${ChangeCase.pascalCase(eventType)}`
    }

    async checkWebhookSignature(request, response) {
        const stripeSignature = request.headers['stripe-signature']

        return this.stripe.webhooks.constructEvent(
            request.body,
            stripeSignature,
            this.webhookSecret
        )
    }
}

module.exports = StripeWebhooksController
