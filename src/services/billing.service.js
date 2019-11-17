const { Container } = require('typedi')
const {
    BILLING_PROVIDER,
    KOPTER_CONFIG,
    SUBSCRIPTION_MODEL
} = require('../utils/constants')
const autobind = require('../utils/autobind')
const isFuture = require('date-fns/isFuture')

class BillingService {
    constructor() {
        this.kopterConfig = Container.get(KOPTER_CONFIG)
        this.BillingProvider = Container.get(BILLING_PROVIDER)
        this.SubscriptionModel = Container.get(SUBSCRIPTION_MODEL)

        autobind(BillingService, this)
    }

    async setupSubscription({
        plan,
        userInstance,
        paymentMethod,
        fromRegistration,
        subscriptionOptions = {}
    }) {
        return await this.BillingProvider.createSubscription({
            userInstance,
            paymentMethod,
            fromRegistration,
            subscriptionOptions,
            plan: this.getPlan(plan),
            billingConfig: this.kopterConfig[this.kopterConfig.billing.provider]
        })
    }

    async cancelSubscription({ userInstance, plan, subscription }) {
        return await this.BillingProvider.cancelSubscription({
            userInstance,
            subscription,
            plan: this.getPlan(plan)
        })
    }

    async resumeSubscription({ user, subscription }) {
        return await this.BillingProvider.resumeSubscription({
            user,
            subscription
        })
    }

    onTrial(subscription) {
        return subscription.trialEnd && isFuture(subscription.trialEnd)
    }

    async switchSubscriptionPlan({ user, plan, currentSubscription }) {
        return await this.BillingProvider.switchSubscriptionPlan({
            user,
            plan: this.getPlan(plan),
            currentSubscription,
            onTrial: this.onTrial(currentSubscription)
        })
    }

    async createCustomer({
        userInstance,
        paymentMethod,
        fromRegistration = false
    }) {
        return await this.BillingProvider.createCustomer(
            userInstance,
            paymentMethod,
            fromRegistration
        )
    }

    async getCustomer(userInstance) {
        return await this.BillingProvider.getOrCreateCustomer(userInstance)
    }

    hasPaymentMethod(userInstance) {
        return !!userInstance.cardBrand
    }

    forceCardOnTrial() {
        return (this.kopterConfig.billing || {}).forceCardOnTrial
    }

    trialDays() {
        return (this.kopterConfig.billing || {}).trialDays
    }

    mustSelectPlan() {
        return (this.kopterConfig.billing || {}).mustSelectPlan
    }

    getPlanIds() {
        if (!this.kopterConfig.billing || !this.kopterConfig.billing.provider)
            return []

        return this.plans().map(plan => plan.id)
    }

    getPlan(planId) {
        return this.plans().find(plan => plan.id === planId)
    }

    isPaidPlan(planId) {
        const plan = this.getPlan(planId)

        if (!plan) return false

        return plan.price > 0
    }

    plans() {
        if (!this.kopterConfig.billing || !this.kopterConfig.billing.provider)
            return []

        return this.kopterConfig[this.kopterConfig.billing.provider].plans
    }

    cardUpFront() {
        return (this.kopterConfig.billing || {}).cardUpFront
    }

    async hasEverSubscribedTo(userInstance, stripePlan) {
        const subscriptionInstance = await this.SubscriptionModel.findOne({
            stripePlan,
            user: userInstance._id
        })

        if (!subscriptionInstance) return false

        return true
    }
}

module.exports = BillingService
