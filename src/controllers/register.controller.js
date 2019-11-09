const Bcrypt = require('bcryptjs')
const { Container } = require('typedi')
const RandomString = require('randomstring')
const { validateAll } = require('indicative/validator')
const {
    EVENT_DISPATCHER,
    USER_SERVICE,
    USER_REGISTERED,
    BILLING_SERVICE
} = require('../utils/constants')

class RegisterController {
    constructor() {
        this.UserService = Container.get(USER_SERVICE)
        this.EventEmitter = Container.get(EVENT_DISPATCHER)
        this.BillingService = Container.get(BILLING_SERVICE)

        this.defaultValidationRules = {
            name: 'string|max:40',
            password: 'required|min:8|max:40',
            email: 'required|email|max:40|unique'
        }

        this.register = this.register.bind(this)
        this.validate = this.validate.bind(this)
        this.creationData = this.creationData.bind(this)
        this.validationRules = this.validationRules.bind(this)
        this.customErrorMessages = this.customErrorMessages.bind(this)
    }

    /**
     * Creates a new user
     * Emits required events
     */
    async register(request, response) {
        const { body } = request

        await this.validate(body)

        // during user registration, let's check the billing settings

        // if cardUpfront is false
        //  we check if freeTrial is configured
        // if freeTrial is configured, then we start a free trial for this user without a credit card

        // if freeTrial is not configured, then we simply do absolutely nothing about billing

        // if cardUpfront is true,
        // we validate to make sure the user provided a selected plan
        // if the selected plan is free
        // we won't validate or ask user for a credit card. we'll just sign the user up
        // if the selected plan is a paid plan
        // we'll make sure we validate the paymentMethod and the plan.
        // then we'll subscribe the user to a plan.
        // if the subscription goes well, good !
        // if the subscription fails, oh boy ! We'll think about this one.

        const user = await this.UserService.create(this.creationData(body))

        let subscription

        // s1 -> cardUpfront and must select plan
        // s2 -> cardUpfront and free trials
        // s3 -> no card upfront and must selected plan  to start free trial
        // s4 -> no card upfront and must not select plan

        if (this.BillingService.cardUpFront() && body.plan) {
            // if cardUpfront is true and user selected a paid plan,
            // we'll subscribe the user to the paid plan
            subscription = await this.BillingService.setupSubscription({
                plan: body.plan,
                userInstance: user,
                fromRegistration: true,
                paymentMethod: body.paymentMethod,
                subscriptionOptions: {}
            })
        }

        // if the user was forced to provide their credit card, but not necessarily select a plan
        // we'll simply add them as a customer
        if (this.BillingService.cardUpFront() && !body.plan) {
            await this.BillingService.createCustomer({
                userInstance: user,
                ...body
            })
        }

        // if the user was not required to select a card up front, but selected a plan, we simply ignore

        const token = this.UserService.generateJWTForUser(user)

        this.EventEmitter.emit(USER_REGISTERED, user)

        return this.successResponse(response, { user, token, subscription })
    }

    async validate(data) {
        await validateAll(
            data,
            this.BillingService.cardUpFront()
                ? this.billingValidationRules(data)
                : this.validationRules(data),
            this.customErrorMessages()
        )
    }

    /**
     *
     * Get the data to create user with
     */
    creationData(data) {
        return {
            ...data,
            password: Bcrypt.hashSync(data.password),
            emailConfirmCode: RandomString.generate(72)
        }
    }

    billingValidationRules(data) {
        // do not require paymentToken if a free plan was selected by user
        // do not even validate plans if the user is not providing credit card up front
        return {
            ...this.defaultValidationRules,
            plan: `${
                this.BillingService.mustSelectPlan() ? 'required|' : ''
            }string|in:${this.BillingService.getPlanIds().join(',')}`,
            paymentMethod: this.BillingService.cardUpFront()
                ? 'required|string'
                : 'string'
        }
    }

    hasPaidPlan(request) {
        if (!request.body.plan) return false

        const plan = this.BillingService.getPlan(request.body.plan)

        return plan && plan.price > 0
    }

    /**
     * Get the validation rules for the
     * user registration
     */
    validationRules() {
        return this.defaultValidationRules
    }

    customErrorMessages() {
        return {}
    }

    successResponse(response, { user, token, subscription }) {
        return response.created({
            user: this.UserService.serializeUser(user),
            token,
            subscription
        })
    }
}

module.exports = RegisterController
