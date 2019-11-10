const {
    USER_SERVICE,
    EVENT_DISPATCHER,
    BILLING_SERVICE,
    SUBSCRIPTION_MODEL
} = require('../utils/constants')
const { Container } = require('typedi')
const autobind = require('../utils/autobind')
const { validateAll } = require('indicative/validator')

class SubscriptionController {
    constructor() {
        this.UserService = Container.get(USER_SERVICE)
        this.EventEmitter = Container.get(EVENT_DISPATCHER)
        this.BillingService = Container.get(BILLING_SERVICE)
        this.SubscriptionModel = Container.get(SUBSCRIPTION_MODEL)

        autobind(SubscriptionController, this)
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

    async resume(request, response) {
        const { user } = request
        // we'll find a subcription for this user that has been cancelled and the endsAt date is greater than now
        // we'll resume the sub by calling the billing provider
        // then we'll set endsAt to null
        const subscription = await this.SubscriptionModel.findOne({
            user: user._id,
            endsAt: {
                $gt: new Date()
            }
        })

        if (!subscription)
            throw new Error('User has no subscriptions that can be resumed.')

        await this.BillingService.resumeSubscription({
            user,
            subscription
        })

        return response.ok('Subscription resumed.')
    }

    async switch(request, response) {
        const { user, body } = request
        // we'll validate the data. should have the plan we're switching to
        // next, we'll check if the selected plan is valid
        // then we'll switch with the billing service

        await this.validateSwitching(body)

        const currentSubscription = await this.SubscriptionModel.findOne({
            user: user._id
        })

        if (body.plan === currentSubscription.stripePlan)
            throw new Error(`User is already subscribed to plan ${body.plan}`)

        await this.BillingService.switchSubscriptionPlan({
            user,
            plan: body.plan,
            currentSubscription
        })

        return response.ok('Subscription switched.')
    }

    validateSwitchingRules() {
        return {
            plan: `required|string|in:${this.BillingService.getPlanIds().join(
                ','
            )}`
        }
    }

    async validateSwitching(body) {
        await validateAll(
            body,
            this.validateSwitchingRules(),
            this.validateSwitchingMessages()
        )
    }

    validateSwitchingMessages() {
        return {}
    }
}

module.exports = SubscriptionController
