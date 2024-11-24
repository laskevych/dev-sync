import express from "express";
const router = express.Router();
import authController from './controller.js';

router.post('/login',
    authController.initAccessCriteria.bind(authController),
    authController.isAccessExist.bind(authController),
    authController.validateLogin.bind(authController),
    authController.login.bind(authController)
);

router.post('/logout',
    authController.initAccessCriteria.bind(authController),
    authController.logout.bind(authController)
);

router.post('/register',
    authController.initAccessCriteria.bind(authController),
    authController.isAccessExist.bind(authController),
    authController.validate.bind(authController),
    authController.create.bind(authController)
);

router.post('/password-reset/',
    authController.initAccessCriteria.bind(authController),
    authController.isAccessExist.bind(authController),
    authController.validatePasswordReset.bind(authController),
    authController.passwordReset.bind(authController)
);

router.post('/password-reset/:token/',
    authController.initAccessCriteria.bind(authController),
    authController.isAccessExist.bind(authController),
    authController.validatePasswordConfirm.bind(authController),
    authController.confirmPasswordReset.bind(authController)
);

router.get('/confirm-email/:token/',
    authController.isAccessExist.bind(authController),
    authController.confirmEmail.bind(authController)
);

export default router;