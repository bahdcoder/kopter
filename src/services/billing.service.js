const { Container } = require('typedi')
const {
    BILLING_PROVIDER,
    KOPTER_CONFIG,
    SUBSCRIPTION_MODEL
} = require('../utils/constants')

class BillingService {
    constructor() {
        this.kopterConfig = Container.get(KOPTER_CONFIG)
        this.BillingProvider = Container.get(BILLING_PROVIDER)
        this.SubscriptionModel = Container.get(SUBSCRIPTION_MODEL)

        this.plans = this.plans.bind(this)
        this.getPlan = this.getPlan.bind(this)
        this.isPaidPlan = this.isPaidPlan.bind(this)
        this.cardUpFront = this.cardUpFront.bind(this)
        this.createCustomer = this.createCustomer.bind(this)
        this.forceCardOnTrial = this.forceCardOnTrial.bind(this)
        this.hasPaymentMethod = this.hasPaymentMethod.bind(this)
        this.hasEverSubscribedTo = this.hasEverSubscribedTo.bind(this)
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

    async createCustomer(userInstance, customerOptions = {}) {
        return await this.BillingProvider.createCustomer(
            userInstance,
            customerOptions
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
