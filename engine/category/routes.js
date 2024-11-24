import express from "express";
const router = express.Router();
import categoryController from './controller.js';
import postController from './../post/controller.js';

router.get('/',
    categoryController.initAccessCriteria.bind(categoryController),
    categoryController.getAll.bind(categoryController)
);

router.get('/:id/',
    categoryController.initAccessCriteria.bind(categoryController),
    categoryController.getById.bind(categoryController)
);

router.post('/',
    categoryController.initAccessCriteria.bind(categoryController),
    categoryController.validate.bind(categoryController),
    categoryController.create.bind(categoryController)
);

router.patch('/:id/',
    categoryController.initAccessCriteria.bind(categoryController),
    categoryController.validate.bind(categoryController),
    categoryController.update.bind(categoryController)
);

router.delete('/:id/',
    categoryController.initAccessCriteria.bind(categoryController),
    categoryController.delete.bind(categoryController)
);

router.get('/:categoryId/posts/',
    postController.initAccessCriteria.bind(postController),
    postController.getPostsByCategoryId.bind(postController)
);

export default router;