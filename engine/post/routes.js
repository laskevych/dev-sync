import express from "express";
const router = express.Router();

import postController from './controller.js';
import likeController from './../like/controller.js';
import commentController from './../comment/controller.js';
import categoryController from './../category/controller.js';
import postFavoriteController from './favorite/controller.js';

router.post('/:postId/favorite/',
    postFavoriteController.initAccessCriteria.bind(postFavoriteController),
    postFavoriteController.createFavoriteByPostId.bind(postFavoriteController)
);

router.delete('/:postId/favorite/',
    postFavoriteController.initAccessCriteria.bind(postFavoriteController),
    postFavoriteController.deleteFavoriteByPostId.bind(postFavoriteController)
);

router.get('/',
    postController.initAccessCriteria.bind(postController),
    postController.getAll.bind(postController)
);

router.get('/:id/',
    postController.initAccessCriteria.bind(postController),
    postController.getById.bind(postController)
);

router.post('/',
    postController.initAccessCriteria.bind(postController),
    postController.validate.bind(postController),
    postController.create.bind(postController)
);

router.patch('/:id/',
    postController.initAccessCriteria.bind(postController),
    postController.validate.bind(postController),
    postController.update.bind(postController)
);

router.delete('/:id/',
    postController.initAccessCriteria.bind(postController),
    postController.delete.bind(postController)
);

router.get('/:postId/categories',
    categoryController.initAccessCriteria.bind(categoryController),
    categoryController.getCategoriesByPostId.bind(categoryController)
);

router.get('/:postId/comments',
    commentController.initAccessCriteria.bind(commentController),
    commentController.getCommentsByPostId.bind(commentController)
);

router.post('/:postId/comments',
    commentController.initAccessCriteria.bind(commentController),
    commentController.createCommentByPostId.bind(commentController)
);

router.get('/:postId/like/',
    likeController.initAccessCriteria.bind(likeController),
    likeController.getLikesByPostId.bind(likeController)
);

router.post('/:postId/like/',
    likeController.initAccessCriteria.bind(likeController),
    likeController.validate.bind(likeController),
    likeController.createLikeByPostId.bind(likeController)
);

router.delete('/:postId/like/:id/',
    likeController.initAccessCriteria.bind(likeController),
    likeController.delete.bind(likeController)
);

export default router;