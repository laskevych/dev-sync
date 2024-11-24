import Controller from './../controller.js';
import CategoryModule from './module.js';
import Where from './../database/where.js';
import { body } from "express-validator";

class CategoryController extends Controller {
    constructor() {
        super(new CategoryModule(), [
            body('title').notEmpty().withMessage('Title cannot be empty. Seriously, add a title!'),
            body('description').optional()
        ]);

        this.accessRules.user.removeCreate().setRead().removeUpdate().removeDelete();
        this.accessRules.guest.setRead();
    }

    /**
     * @return {CategoryModule}
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
    async getCategoriesByPostId(req, res, next) {
        try {
            const categories = await this.module.getCategoriesByPostId(req.params.postId)
            return this.returnResponse(res, 200, {
                data: categories.map(record => record.toJSON())
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * @inheritDoc
     */
    getFilters(req) {
        const filter = [];
        const allowedFilter = ['postId'];
        Object.keys(req.query).forEach(fieldName => {
            if (allowedFilter.includes(fieldName) && !filter.hasOwnProperty(fieldName)) {
                filter.push(
                    new Where(fieldName, '=', req.query[fieldName])
                );
            }
        });

        return filter;
    }

    getSorting(req) {
        return 'id ASC';
    }
}

export default new CategoryController();