import Controller from './../controller.js';
import LikeModule from "./module.js";
import PostModule from "../post/module.js";
import CommentModule from "../comment/module.js";
import Where from "../database/where.js";
import { body } from "express-validator";

class LikeController extends Controller {
    constructor() {
        super(
            new LikeModule(), [
                body('type').notEmpty().withMessage('Please provide a like type. It’s not that hard.').isIn(['like', 'dislike']).withMessage('Like type should be either \'like\' or \'dislike.\' Don’t overcomplicate it.')
            ]
        );
        this.accessRules.user.setRead();
        this.accessRules.guest.setRead();
    }

    /**
     * @return {LikeModule}
     */
    get module() {
        return super.module;
    }

    /**
     * @param {string} moduleName
     * @param {number} recordId
     * @return {Promise<boolean>}
     * @private
     */

    /**
     * @inheritDoc
     */
    getFilters(req) {
        const filter = [];
        const allowedFilter = ['postId', 'commentId'];
        Object.keys(req.query).forEach(fieldName => {
            if (allowedFilter.includes(fieldName) && !filter.hasOwnProperty(fieldName)) {
                filter.push(new Where(fieldName, '=', req.query[fieldName]));
            }
        });

        return filter;
    }

    async #isLikeExist(moduleName, recordId) {
        let isRecordExist = false;
        if (moduleName === 'commentId') {
            const commentModule = new CommentModule();
            const comment = await commentModule.getRecordById(recordId);
            if (comment) {
                isRecordExist = true;
            }
        } else if (moduleName === 'postId') {
            const postModule = new PostModule();
            await postModule.recalculateLikesByPostId(recordId);
            const post = await postModule.getRecordById(recordId);
            if (post) {
                isRecordExist = true;
            }
        }

        return isRecordExist;
    }

    /**
     * @param {LikeRecord} like
     * @param {string} moduleName
     * @param {number} recordId
     * @return {Promise<void>}
     * @private
     */
    async #updateUserRating(like, moduleName, recordId) {
        let author;
        if (moduleName === 'commentId') {
            const commentModule = new CommentModule();
            const comment = await commentModule.getRecordById(recordId);
            author = comment.author;
        } else if (moduleName === 'postId') {
            const postModule = new PostModule();
            await postModule.recalculateLikesByPostId(recordId);
            const post = await postModule.getRecordById(recordId);
            author = post.author;
        }

        if (author) {
            await author.recalculateRating();
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async create(req, res, next) {
        try {
            const fields = this.getRequestBody(req);
            if (this.module.fields.includes(this.module.createdByField)) {
                fields[this.module.createdByField] = req.user.id;
            }

            let moduleName = undefined;
            let recordId = undefined;
            if (fields.commentId) {
                moduleName = 'commentId';
                recordId = fields.commentId;
            } else if (fields.postId) {
                moduleName = 'postId';
                recordId = fields.postId;
            }

            if (!await this.#isLikeExist(moduleName, recordId)) {
                return this.returnRecordNotFound(res);
            }

            let likeStatus;
            let like = await this.module.getLikeByCreatedByIdAndPostOrCommentId(
                req.user.id,
                moduleName,
                recordId
            );
            if (!like) {
                like = this.module.createRecord(fields);
                await like.save();
                likeStatus = 'isCreated';
            } else {
                if (like.type !== fields.type) {
                    like.type = fields.type;
                    await like.save();
                    likeStatus = 'isUpdated';
                }
            }

            if (likeStatus) {
                await this.#updateUserRating(
                    like,
                    moduleName,
                    recordId
                );
            }

            return res.status(201).json({
                data: like.toJSON(),
            });
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
    async delete(req, res, next) {
        try {
            /** @type {LikeRecord} */
            const like = await this.getRecordByIdAndAccessCriteria(req);
            if (!like) {
                return this.returnRecordNotFound(res);
            }

            await like.delete();
            await this.#updateUserRating(
                like,
                like.commentId ? 'commentId' : 'postId',
                like.commentId ?? like.postId
            );

            return this.returnResponse(res, 200, {
                data: like.toJSON()
            });
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
    async getLikesByPostId(req, res, next) {
        req.query.postId = req.params.postId;
        return this.getAll(req, res, next);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async createLikeByPostId(req, res, next) {
        req.body.postId = req.params.postId;
        return this.create(req, res, next);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async getLikesByCommentId(req, res, next) {
        req.query.commentId = req.params.commentId;
        return this.getAll(req, res, next);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async createLikeByCommentId(req, res, next) {
        req.body.commentId = req.params.commentId;
        return this.create(req, res, next);
    }
}

export default new LikeController();