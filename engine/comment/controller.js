import CommentModule from "./module.js";
import Controller from './../controller.js';
import Where from './../database/where.js';
import PostModule from "../post/module.js";
import { body } from "express-validator";

class CommentController extends Controller {
    constructor() {
        super(new CommentModule(), [
            body('content').notEmpty().withMessage('Content cannot be empty. What’s the point of an empty comment?'),
            body('status').optional().isIn(['active', 'inactive']).withMessage('Comment status must be either \'active\' or \'inactive.\' Stop playing games.')
        ]);

        this.accessRules.user.setRead().setUpdate(['content', 'status', 'isBest'], [{ field: this.module.createdByField, operator: '=', value: '' }]);
        this.accessRules.guest.setRead();
    }

    /**
     * @return {CommentModule}
     */
    get module() {
        return super.module;
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async createCommentByCommentId(req, res, next) {
        req.body.commentId = req.params.commentId;
        return this.create(req, res, next);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async createCommentByPostId(req, res, next) {
        req.body.postId = req.params.postId;
        return this.create(req, res, next);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async getCommentsByPostId(req, res, next) {
        req.query.postId = req.params.postId;
        return this.getAll(req, res, next);
    }

    /**
     * @inheritDoc
     */
    getFilters(req) {
        const filter = [];
        const allowedFilter = ['createdById', 'postId'];
        Object.keys(req.query).forEach(fieldName => {
            if (allowedFilter.includes(fieldName) && !filter.hasOwnProperty(fieldName)) {
                if (fieldName === 'postId') {
                    filter.push(new Where('commentId', 'IS', null));
                    filter.push(new Where(fieldName, '=', req.query[fieldName]));
                } else {
                    filter.push(new Where(fieldName, '=', req.query[fieldName]));
                }
            }
        });

        return filter;
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async setBest(req, res, next) {
        try {
            const comment = await this.module.getRecordById(req.params.id);
            if (!comment) {
                return this.returnRecordNotFound(res);
            }

            const postModule = new PostModule();
            const post = await postModule.getRecordById(comment.postId);
            if (!post) {
                return this.returnRecordNotFound(res);
            }

            if (post[postModule.createdByField] !== req.user.id) {
                return this.returnResponse(res, 403, {}, "Only the post creator can select the most helpful comment. Stay in your lane!");
            }

            comment.isBest = !comment.isBest;
            await comment.save();

            return this.returnResponse(res, 200, {
                data: comment.toJSON()
            });
        } catch (e) {
            next(e);
        }
    }

    getSorting(req) {
        return 'isBest DESC, id DESC';
    }
}

export default new CommentController();