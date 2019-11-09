const {
    USER_SERVICE,
    EVENT_DISPATCHER,
    BILLING_SERVICE,
    SUBSCRIPTION_MODEL
} = require('../utils/constants')
const { Container } = require('typedi')

class SubscriptionController {
    constructor() {
        this.UserService = Container.get(USER_SERVICE)
        this.EventEmitter = Container.get(EVENT_DISPATCHER)
        this.BillingService = Container.get(BILLING_SERVICE)
        this.SubscriptionModel = Container.get(SUBSCRIPTION_MODEL)

        this.cancel = this.cancel.bind(this)
    }

    async cancel(request, response) {
        const { body, user } = request

        // if user is cancelling their subscription, we'll first find the sub
        // next, we'll call the billing service to cancel
        const subscription = await this.SubscriptionModel.findOne({
            user: user._id
        })

        if (!subscription) throw new Error('User has no subscription.')

        await this.BillingService.cancelSubscription({
            userInstance: user,
            plan: body.plan,
            subscription
        })

        return response.ok('Subscription cancelled.')
    }
}

module.exports = SubscriptionController
