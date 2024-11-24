import Controller from "../controller.js";
import { body } from "express-validator";
import PostModule from "./module.js";
import PostFavoritesModule from "./favorite/module.js";
import PostCategoryModule from "./category/module.js";
import Where from "../database/where.js";

class PostController extends Controller {
    constructor() {
        super(new PostModule(), [
            body('title').notEmpty().withMessage('Title cannot be empty. Seriously, add a title!'),
            body('content').notEmpty().withMessage('Content cannot be empty. What’s the point of an empty post?'),
            body('status').optional().isIn(['active', 'inactive']).withMessage('Post status must be either \'active\' or \'inactive.\' Stop playing games.')
        ]);

        this.accessRules.user
            .setCreate(this.module.fields.filter(field => !['likes', 'isTop'].includes(field)))
            .setRead([], [
                [
                    { field: this.module.createdByField, operator: '=', value: ''},
                    { field: 'status', operator: '=', value: 'active' },
                ]
            ])
            .setUpdate(this.module.fields.filter(field => !['likes', 'isTop'].includes(field)), [
                { field: this.module.createdByField, operator: '=', value: ''}
            ])
            .setDelete(this.module.fields.filter(field => !['likes', 'isTop'].includes(field)), [
                { field: this.module.createdByField, operator: '=', value: ''}
            ]);
        this.accessRules.guest.setRead([], [ { field: 'status', operator: '=', value: 'active' } ]);

        this._recordsPerPage = 10;
    }

    /**
     * @return {PostModule}
     */
    get module() {
        return super.module;
    }

    /**
     * @inheritDoc
     */
    getFilters(req) {
        const filter = [];
        const defaultFilter = [
            'id',
            'status',
            'isTop',
            'categories',
            'createdAtFrom',
            'createdAtTo',
            'createdById'
        ];

        Object.keys(req.query).forEach(fieldName => {
            if (defaultFilter.includes(fieldName) && !filter.hasOwnProperty(fieldName)) {
                let field, operator;
                field = fieldName;
                let value = req.query[fieldName];
                switch (fieldName) {
                    case 'categories':
                        operator = 'IN';
                        value = value.trim().split(',');
                        break;
                    case 'createdAtFrom':
                        operator = '>=';
                        field = 'createdAt';
                        break;
                    case 'createdAtTo':
                        operator = '<=';
                        field = 'createdAt';
                        break;
                    case 'id':
                        operator = 'IN';
                        value = value.trim().split(',');
                        break;
                    default:
                        operator = '=';
                        break;
                }

                filter.push(new Where(field, operator, value));
            }
        });

        return filter;
    }

    /**
     * @inheritDoc
     */
    getSorting(req) {
        let sortBy = 'createdAt DESC';
        if (req.query && req.query.hasOwnProperty('sortBy')) {
            const sortParts = req.query.sortBy.split(':');
            if (!['createdAt', 'likes'].includes(sortParts[0])) {
                return sortBy;
            }

            if (sortParts.length === 1) {
                sortBy = `${sortParts[0].trim()} ASC`
            } else if (
                sortParts.length === 2
                && ['ASC', 'DESC'].includes(sortParts[1].trim().toUpperCase())
            ) {
                sortBy = `${sortParts[0].trim()} ${sortParts[1].trim().toUpperCase()}`
            }
        }

        return sortBy;
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async getPostsByCategoryId(req, res, next) {
        req.query.categories = req.params.categoryId;

        return this.getAll(req, res, next);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async getUserPosts(req, res, next) {
        try {
            req.query.createdById = req.params.userId;
            return this.getAll(req, res, next);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async getFavoritePosts(req, res, next) {
        try {
            const module = new PostFavoritesModule();
            const postIds = await module.getPostIdsByUser(req?.params?.userId);
            req.query.id = postIds.join(',');

            return this.getAll(req, res, next);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async update(req, res, next) {
        try {
            const record = await this.getRecordByIdAndAccessCriteria(req);
            if (!record) {
                return this.returnRecordNotFound(res);
            }

            Object.assign(record, this.getRequestBody(req));
            await record.save();


            if (req?.body?.categories !== undefined) {
                const categoryIds = new Set();
                if (req.body.categories.length > 0) {
                    req.body.categories.split(',').forEach(categoryId => {
                        if (Number.isInteger(Number(categoryId))) {
                            categoryIds.add(Number(categoryId));
                        }
                    });
                }

                if (record.id) {
                    const postCategoryModule = new PostCategoryModule();
                    await postCategoryModule.saveCategories(record.id, categoryIds);
                }
            }

            const post = await this.module.getRecordById(record.id);

            return this.returnResponse(res, 200, {
                data: post.toJSON()
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
    async create(req, res, next) {
        try {
            const fields = this.getRequestBody(req);
            if (this.module.fields.includes(this.module.createdByField)) {
                fields[this.module.createdByField] = req.user.id;
            }

            const newRecord = this.module.createRecord(fields);
            await newRecord.save();

            const categoryIds = new Set();
            if (req?.body?.categories && req?.body?.categories.length > 0) {
                req.body.categories.split(',').forEach(categoryId => {
                    if (Number.isInteger(Number(categoryId))) {
                        categoryIds.add(Number(categoryId));
                    }
                });
            }

            if (categoryIds.size > 0 && newRecord.id) {
                const postCategoryModule = new PostCategoryModule();
                await postCategoryModule.saveCategories(newRecord.id, categoryIds);
            }

            const post = await this.module.getRecordById(newRecord.id);

            return res.status(201).json({
                data: post.toJSON(),
            });
        } catch (e) {
            next(e);
        }
    }
}

export default new PostController();