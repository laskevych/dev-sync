import UserModule from "../../user/module.js";
import jwt from 'jsonwebtoken';

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @return {Promise<*>}
 */
export async function setUserByJWT(req, res, next) {
    const authTokenHeader = req.headers['authorization'];
    const token = authTokenHeader && authTokenHeader.split(' ')[1];
    if (token) {
        try {
            const userDecoded = await jwt.verify(token, process.env.APPLICATION_SECRET);
            const module = new UserModule();
            if (userDecoded?.id) {
                const user = await module.getRecordById(userDecoded.id);
                if (!user) {
                    return invalidCredentials(req, res, "User not found by token. Stop messing around.");
                }

                req.user = user;
            }

        } catch (e) {
            return invalidCredentials(req, res);
        }
    }

    next();
}

function invalidCredentials(req, res, message = "Invalid token. Stop messing around and provide a valid one.") {
    return res.status(401).json({
        message,
        statusCode: req.statusCode
    });
}