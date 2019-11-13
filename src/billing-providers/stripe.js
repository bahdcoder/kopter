const Stripe = require('stripe')
const { Container } = require('typedi')
const autobind = require('../utils/autobind')
const fromUnixTime = require('date-fns/fromUnixTime')
const { USER_MODEL, SUBSCRIPTION_MODEL } = require('../utils/constants')

class StripeBillingProvider {
    constructor() {
        this.stripe = Stripe(process.env.STRIPE_API_KEY)

        this.UserModel = Container.get(USER_MODEL)
        this.SubscriptionModel = Container.get(SUBSCRIPTION_MODEL)

        autobind(StripeBillingProvider, this)
    }

    async createCustomer(
        userInstance,
        paymentMethod = null,
        fromRegistration = false
    ) {
        let customerOptions = {}

        let stripePaymentMethod = null

        try {
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

        subscription.endsAt = fromUnixTime(
            stripeSubscription.current_period_end
        )

        await subscription.save()
    }

    async switchSubscriptionPlan({ user, plan, currentSubscription, onTrial }) {
        const stripeSubscription = await this.stripe.subscriptions.retrieve(
            currentSubscription.stripeId
        )

        const updatedSubscription = await this.stripe.subscriptions.update(
            currentSubscription.stripeId,
            {
                cancel_at_period_end: false,
                items: [
                    {
                        id: stripeSubscription.items.data[0].id,
                        plan: plan.id
                    }
                ]
            }
        )

        currentSubscription.endsAt = null
        currentSubscription.stripePlan = plan.id
        currentSubscription.stripeStatus = updatedSubscription.status

        await currentSubscription.save()

        await this.generateCustomerInvoice(user)
    }

    async generateCustomerInvoice(user) {
        if (!user || !user.stripeId) return false

        await this.stripe.invoices.create({
            customer: user.stripeId
        })

        return true
    }

    async resumeSubscription({ user, subscription }) {
        await this.stripe.subscriptions.update(subscription.stripeId, {
            cancel_at_period_end: false
        })

        subscription.endsAt = null

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
}

StripeBillingProvider.providerName = 'stripe'

module.exports = StripeBillingProvider
