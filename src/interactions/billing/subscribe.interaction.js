const { Container } = require('./node_modules/typedi')
const { BILLING_SERVICE } = require('../../utils/constants')

class SubscribeInteraction {
    constructor() {
        this.BillingService = Container.get(BILLING_SERVICE)
    }

    handle(userInstance, plan, fromRegistration = false, data = {}) {
        const subscriptionOptions = {
            plan,
            quantity: 1,
            billing_cycle_anchor: null
        }

        if (
            !fromRegistration &&
            this.BillingService.hasEverSubscribedTo(userInstance, plan)
        ) {
            subscriptionOptions.trial_end = undefined
        }
    }
}

module.exports = SubscribeInteraction
