import express from "express";
const router = express.Router();
import commentController from './controller.js';
import likeController from './../like/controller.js'

router.get('/',
    commentController.initAccessCriteria.bind(commentController),
    commentController.getAll.bind(commentController)
);

router.get('/:id/',
    commentController.initAccessCriteria.bind(commentController),
    commentController.getById.bind(commentController)
);

router.patch('/:id/',
    commentController.initAccessCriteria.bind(commentController),
    commentController.validate.bind(commentController),
    commentController.update.bind(commentController)
);

router.delete('/:id/',
    commentController.initAccessCriteria.bind(commentController),
    commentController.delete.bind(commentController)
);

router.patch('/:id/setBest/',
    commentController.initAccessCriteria.bind(commentController),
    commentController.setBest.bind(commentController)
);

router.get('/:commentId/like/',
    likeController.initAccessCriteria.bind(likeController),
    likeController.getLikesByCommentId.bind(likeController)
);

router.post('/:commentId/like/',
    likeController.initAccessCriteria.bind(likeController),
    likeController.validate.bind(likeController),
    likeController.createLikeByCommentId.bind(likeController)
);

router.delete('/:commentId/like/:id/',
    likeController.initAccessCriteria.bind(likeController),
    likeController.delete.bind(likeController)
);

export default router;