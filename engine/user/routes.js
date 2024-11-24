import express from "express";
import UserController from "./controller.js";
const controller = new UserController();
import postController from "./../post/controller.js";
import uploadMiddleware from "./middlewares/avatarUploader.js";
const router = express.Router();

router.get('/',
    controller.initAccessCriteria.bind(controller),
    controller.getAll.bind(controller)
);

router.get('/:id/',
    controller.initAccessCriteria.bind(controller),
    controller.getById.bind(controller)
);
router.post('/',
    controller.initAccessCriteria.bind(controller),
    controller.validate.bind(controller),
    controller.create.bind(controller)
);

router.patch('/:id/',
    controller.initAccessCriteria.bind(controller),
    controller.validateUpdate.bind(controller),
    controller.update.bind(controller)
);

router.patch('/:id/avatar/',
    controller.initAccessCriteria.bind(controller),
    uploadMiddleware,
    controller.update.bind(controller)
);

router.delete('/:id/',
    controller.initAccessCriteria.bind(controller),
    controller.delete.bind(controller)
);

router.get('/:userId/posts/',
    postController.initAccessCriteria.bind(postController),
    postController.getUserPosts.bind(postController)
);

router.get('/:userId/favorite/',
    postController.initAccessCriteria.bind(postController),
    postController.getFavoritePosts.bind(postController)
);

export default router;