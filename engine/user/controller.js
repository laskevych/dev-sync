import Controller from "../controller.js";
import UserModule from "./module.js";
import { body } from "express-validator";

class UserController extends Controller {
    constructor() {
        super(new UserModule(),
            [
                body('email')
                    .notEmpty().withMessage('No email? Seriously? Provide it now!')
                    .isEmail().withMessage('This email is invalid. Are you even trying?'),
                
                body('login')
                    .notEmpty().withMessage('Login is missing! Don’t waste my time, provide one.')
                    .isLength({ min: 4 }).withMessage('Login is too short! It must be at least 4 characters. Do better.')
                    .isLowercase().withMessage('Login must be in lowercase! Fix it.'),

                body('fullName')
                    .optional()
                    .isLength({ min: 3 }).withMessage('Full name is too short. Make it at least 3 characters, or don’t bother.'),
                
                body('password')
                    .isStrongPassword({ minLength: 5 })
                    .withMessage("Weak password detected! Use at least 5 characters, including an uppercase letter, a symbol, and a number. Step up!"),

                body('password_confirm')
                    .notEmpty().withMessage('Where is your password confirmation? Provide it now!')
                    .custom((value, { req }) => {
                        if (value !== req.body.password) {
                            throw new Error('Password confirmation doesn’t match the password. Fix this nonsense.');
                        }
                        return true;
                    })
            ]
        );

        this.validationOfUpdate = [
            body('fullName')
                .optional()
                .isLength({ min: 3 }).withMessage('Full name should be at least 3 characters long.'),

            body('password')
                .optional()
                .isStrongPassword({ minLength: 5 })
                .withMessage("Password should be at least 5 characters long and include an uppercase letter, a symbol, and a number."),

            body('password_confirm')
                .optional()
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Password confirmation does not match the password.');
                    }
                    return true;
                })
        ];

        this.accessRules.admin.setUpdate(this.module.fields.filter(field => !['login', 'email', 'rating'].includes(field)));

        this.accessRules.user
            .removeCreate()
            .setRead([], [])
            .setUpdate(
                this.module.fields.filter(field => !['login', 'email', 'rating', 'role', 'isEmailVerified', 'createdAt'].includes(field)),
                [{field: 'id', operator: '=', value: null}]
            )
            .removeDelete();

        this.accessRules.guest.setRead();
    }

    /**
     * @return {UserModule}
     */
    get module() {
        return super.module
    }

    /**
     * @inheritDoc
     */
    async create(req, res, next) {
        try {
            const validationErrs = [];

            let user = await this.module.getByLogin(req?.body?.login);
            if (user) {
                validationErrs.push({ path: 'login', msg: 'Login already exists. Pick another one and stop wasting time.' });
            }

            user = await this.module.getByEmail(req?.body?.email);
            if (user) {
                validationErrs.push({ path: 'email', msg: 'Email already exists. Use a different one or fix this mess.' });
            }

            if (validationErrs.length > 0) {
                return this.returnResponse(
                    res,
                    400,
                    {
                        validationErrs,
                        validationSuccesses: req.validationSuccesses
                    },
                    "Validation failed. Fix your input and try again."
                );
            }

            const fields = this.getRequestBody(req);
            if (fields.password) {
                fields.password = await this.module.createPassword(fields.password);
            }

            const newUser = this.module.createRecord(fields);
            await newUser.save();

            req.newUser = newUser.toJSON();

            return res.status(201).json({
                data: newUser.toJSON(),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async validateUpdate(req, res, next) {
        return await this.validate(req, res, next,
            this.validationOfUpdate
        );
    }

    async update(req, res, next) {
        if (
            req?.user?.role === 'user'
            && req?.accessCriteria
        ) {
            req.accessCriteria.filter.forEach(item => {
                if (item.field === 'id') {
                    item.value = req.user.id
                }
            });
        }

        if (req?.body?.password) {
            req.body.password = await this.module.createPassword(req.body.password);
        }


        return super.update(req, res, next);
    }
}

export default UserController;