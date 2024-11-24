import UserController from "../user/controller.js";
import * as mailer from "../../mailer/service.js";
import jwt from 'jsonwebtoken';
import * as argon2 from "argon2";

class AuthController extends UserController {
    constructor() {
        super();

        this.validationOfLogin = this.validationRules.filter(rule => ['login', 'password'].includes(rule.builder.fields[0]));
        this.validationOfPasswordReset = this.validationRules.filter(rule => ['email'].includes(rule.builder.fields[0]));
        this.validationOfPasswordResetConfirm = this.validationRules.filter(rule => ['password', 'password_confirm'].includes(rule.builder.fields[0]));

        this.accessRules.admin.removeAll();
        this.accessRules.user.removeAll();
        this.accessRules.guest.setCreate(this.module.fields.filter(field => !['profilePicture', 'role', 'isEmailVerified', 'rating', 'createdAt'].includes(field)));
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async validatePasswordConfirm(req, res, next) {
        return await this.validate(req, res, next, this.validationOfPasswordResetConfirm);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async validateLogin(req, res, next) {
        return await this.validate(req, res, next, this.validationOfLogin);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async validatePasswordReset(req, res, next) {
        return await this.validate(req, res, next, this.validationOfPasswordReset);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async isAccessExist(req, res, next) {
        if (req.user) {
            return this.returnAccessDenied(res);
        }

        next();
    }

    /**
     * @param {Object} data
     * @param {string} expiresIn
     * @return {string}
     */
    createAccessToken(data, expiresIn = '14d') {
        return jwt.sign(data, process.env.APPLICATION_SECRET, { expiresIn } );
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async create(req, res, next) {
        const userControllerResponse = await super.create(req, res, next);
        if (!req.user && userControllerResponse?.statusCode === 201) {
            const newUser = userControllerResponse.req?.newUser;
            await mailer.sendConfirm(newUser.email, { fullName: newUser.fullName, token: this.createAccessToken({ userEmail: newUser.email })});
        }

        return userControllerResponse;
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async confirmEmail(req, res, next) {
        try {
            try {
                const decodedData = jwt.verify(
                    req.params.token,
                    process.env.APPLICATION_SECRET
                );

                const user = await this.module.getByEmail(decodedData.userEmail);
                if (!user) {
                    return this.returnRecordNotFound(res);
                }

                user.isEmailVerified = true;
                await user.save();

                return this.returnResponse(res, 200, {}, 'Email is already confirmed. What are you trying to prove?')
            } catch (e) {
                return this.returnResponse(res, 400, {}, "Invalid token. Stop messing around and provide a valid one.");
            }
        } catch (e) {
            next(e);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async login(req, res, next) {
        try {
            const validationErrs = [];
            const fields = this.getRequestBody(req);

            const user = await this.module.getByLogin(fields.login);
            let passwordIsValid = false;
            if (user) {
                passwordIsValid = await argon2.verify(user.password, fields.password ?? '');
            }

            if (!passwordIsValid || !user) {
                validationErrs.push({ path: 'login', msg: 'User doesn’t exist or the password is wrong. Get it right!' });
            }

            if (user && !user.isEmailVerified) {
                validationErrs.push({ path: 'login', msg: 'Verify your email already! Stop stalling.' });
            }

            if (validationErrs.length > 0) {
                return this.returnResponse(
                    res,
                    401,
                    {
                        validationErrs,
                        validationSuccesses: req.validationSuccesses
                    },
                    "Validation failed. Fix your input and try again."
                );
            }

            return this.returnResponse(res, 200, {
                accessToken: this.createAccessToken({ id: user.id, email: user.email, role: user.role }),
                data: user.toJSON()
            }, 'Login successful. Finally, you did something right.')

        } catch (e) {
            next(e);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async logout(req, res, next) {
        try {
            return this.returnResponse(res, 200, {}, "Good bye!!!")
        } catch (e) {
            next(e);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async confirmPasswordReset(req, res, next) {
        try {
            try {
                const tokenData = jwt.verify(req.params.token, process.env.APPLICATION_SECRET);
                const user = await this.module.getByEmail(tokenData.userEmail);
                if (!user) {
                    return this.returnRecordNotFound(res);
                }

                user.password = await this.module.createPassword(req.body.password);
                await user.save();

                return this.returnResponse(res, 200, {}, "Password has been changed. Don’t mess it up again.")
            } catch (e) {
                return this.returnResponse(res, 400, {}, "Invalid token. Get it right or don’t bother.");
            }
        } catch (e) {
            next(e);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async passwordReset(req, res, next) {
        try {
            const fields = this.getRequestBody(req);
            const user = await this.module.getByEmail(fields.email);
            if (!user) {
                return this.returnRecordNotFound(res);
            }

            await mailer.sendPasswordReset(
                user.email,
                { fullName: user.fullName, token: this.createAccessToken({ userEmail: user.email }) }
            );

            return this.returnResponse(res, 200, {}, 'Password reset. Try not to forget it this time.')
        } catch (e) {
            next(e);
        }
    }
}

export default new AuthController();
