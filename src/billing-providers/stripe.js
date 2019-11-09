const Stripe = require('stripe')
const { Container } = require('typedi')
const fromUnixTime = require('date-fns/fromUnixTime')
const { USER_MODEL, SUBSCRIPTION_MODEL } = require('../utils/constants')

class StripeBillingProvider {
    constructor() {
        this.stripe = Stripe(process.env.STRIPE_API_KEY)

        this.UserModel = Container.get(USER_MODEL)
        this.SubscriptionModel = Container.get(SUBSCRIPTION_MODEL)

        this.updateCustomer = this.updateCustomer.bind(this)
        this.createCustomer = this.createCustomer.bind(this)
        this.addPaymentMethod = this.addPaymentMethod.bind(this)
        this.createSetupIntent = this.createSetupIntent.bind(this)
        this.getPaymentMethods = this.getPaymentMethods.bind(this)
        this.createSubscription = this.createSubscription.bind(this)
        this.cancelSubscription = this.cancelSubscription.bind(this)
        this.prepareSubscriptionResponse = this.prepareSubscriptionResponse.bind(
            this
        )
    }

    async createCustomer(
        userInstance,
        paymentMethod = null,
        fromRegistration = false
    ) {
        let customerOptions = {}

        let stripePaymentMethod = null

        if (paymentMethod) {
            customerOptions = {
                ...customerOptions,
                payment_method: paymentMethod,
                invoice_settings: {
                    default_payment_method: paymentMethod
                }
            }

            stripePaymentMethod = await this.stripe.paymentMethods.retrieve(
                paymentMethod
            )
        }

        try {
            const stripeCustomer = await this.stripe.customers.create({
                email: userInstance.email,
                name: userInstance.name || undefined,
                ...customerOptions
            })

            userInstance.stripeId = stripeCustomer.id

            if (stripePaymentMethod) {
                userInstance.cardBrand = stripePaymentMethod.card.brand
                userInstance.cardLastFour = stripePaymentMethod.card.last4
            }

            await userInstance.save()

            return { stripeCustomer, userInstance }
        } catch (error) {
            if (
                ['card_declined'].includes(error.raw.code) &&
                fromRegistration
            ) {
                await this.UserModel.deleteOne({ _id: userInstance._id })
            }

            throw error
        }
    }

    async cancelSubscription({ userInstance, plan, subscription }) {
        const stripeSubscription = await this.stripe.subscriptions.update(
            subscription.stripeId,
            {
                cancel_at_period_end: true
            }
        )

        console.log(
            '______________________________________---__',
            stripeSubscription
        )

        subscription.endsAt = fromUnixTime(
            stripeSubscription.current_period_end
        )

        await subscription.save()
    }

    prepareSubscriptionResponse(subscription) {
        const paymentIntent = subscription.latest_invoice.payment_intent

        if (!paymentIntent) return {}

        // if the payment succeeded, no further action is required
        // if it failed and we require a new payment method, we'll return this status
        // to the frontend so a new payment method can be requested from the user
        if (
            ['requires_payment_method', 'succeeded'].includes(
                paymentIntent.status
            )
        )
            return {
                paymentIntentStatus: paymentIntent.status
            }

        // if the payment requires user action,
        // we'll return a client secret so that the subscription can be confirmed on the frontend

        // we'll be sure to handle the webhooks for invoice paid so we update the subscription status in the database
        if (paymentIntent.status === 'requires_action')
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentStatus: paymentIntent.status
            }
    }

    async createSubscription({
        plan,
        userInstance,
        paymentMethod,
        billingConfig,
        subscriptionOptions,
        fromRegistration = false
    }) {
        let user = userInstance
        // check if this user is a customer
        if (!userInstance.stripeId) {
            const { userInstance: updatedUser } = await this.createCustomer(
                userInstance,
                paymentMethod,
                fromRegistration
            )

            user = updatedUser
        }

        const subscription = await this.stripe.subscriptions.create({
            items: [{ plan: plan.id }],
            customer: user.stripeId,
            expand: ['latest_invoice.payment_intent'],
            trial_period_days: plan.trialDays || undefined,
            ...subscriptionOptions
        })

        await this.SubscriptionModel.create({
            paymentIntentStatus: (
                subscription.latest_invoice.payment_intent || {}
            ).status,
            stripeStatus: subscription.status,
            stripeId: subscription.id,
            stripePlan: plan.id,
            trialEndsAt: plan.trialDays
                ? fromUnixTime(subscription.trial_end)
                : null,
            endsAt: null,
            user: user._id
        })

        return this.prepareSubscriptionResponse(subscription)
    }

    async getCustomer() {}

    async updateCustomer(userInstance, options = {}) {
        return await this.stripe.customers.update({
            id: userInstance.stripeId,
            ...options
        })
    }

    async createSetupIntent() {}

    async resolveStripePaymentMethod(paymentMethod) {
        return await this.stripe.paymentMethods.retrieve(paymentMethod)
    }

    async getPaymentMethods(userInstance) {
        return await this.stripe.paymentMethods.list({
            customer: userInstance.stripeId
        })
    }

    async defaultPaymentMethod(userInstance) {
        if (!userInstance.stripeId) return null

        const customer = await this.stripe.customers.retrieve(
            userInstance.stripeId,
            {
                expand: [
                    'invoice_settings.default_payment_method',
                    'default_source'
                ]
            }
        )

        if (customer.invoice_settings.default_payment_method) {
            return customer.invoice_settings.default_payment_method
        }

        return customer.default_source
    }

    async addPaymentMethod(userInstance, paymentMethod) {
        let stripePaymentMethod = await this.resolveStripePaymentMethod(
            paymentMethod
        )

        if (userInstance.stripeId !== stripePaymentMethod.customer) {
            stripePaymentMethod = await stripePaymentMethod.attach(
                paymentMethod,
                {
                    customer: userInstance.stripeId
                }
            )
        }

        return stripePaymentMethod
    }
}

StripeBillingProvider.providerName = 'stripe'

module.exports = StripeBillingProvider
