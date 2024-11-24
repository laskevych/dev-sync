import { validationResult } from "express-validator";
import Where from './database/where.js';
import AccessRule from './access/rule.js';

class Controller {
    #module;
    #validationRules = [];
    #accessRules = {};
    
    /**
     * @type {number}
     */
    _recordsPerPage;

    /**
     * @param {Module} module
     * @param {[]} validationRules
     */
    constructor(module, validationRules = []) {
        this.#module = module;
        this.#validationRules = validationRules;

        this.#accessRules = {
            admin: (new AccessRule(this.module))
                .setCreate()
                .setRead()
                .setUpdate()
                .setDelete(),
            user: (new AccessRule(this.module))
                .setCreate()
                .setRead([], [ { field: this.module.createdByField, operator: '=', value: '' } ])
                .setUpdate([], [ { field: this.module.createdByField, operator: '=', value: '' } ])
                .setDelete([], [ { field: this.module.createdByField, operator: '=', value: '' } ]),
            guest: new AccessRule(this.module)
        }
    }

    /**
     * @return {Module}
     */
    get module() {
        return this.#module;
    }

    get validationRules() {
        return this.#validationRules;
    }

    /**
     * @type {{admin: AccessRule, guest: AccessRule, user: AccessRule}}
     */
    get accessRules() {
        return this.#accessRules;
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    async initAccessCriteria(req, res, next= undefined) {
        const accessRule = this.accessRules[(req?.user?.role ?? 'guest')];
        let accessCriteria;
        if (req.method === 'GET') {
            accessCriteria = accessRule.getRead(req?.user);
        } else if (req.method === 'POST') {
            accessCriteria = accessRule.getCreate(req?.user);
        } else if (req.method === 'PATCH') {
            accessCriteria = accessRule.getUpdate(req?.user);
        } else if (req.method === 'DELETE') {
            accessCriteria = accessRule.getDelete(req?.user);
        }

        if (!accessCriteria) {
            return this.returnAccessDenied(res, req?.user?.id ? 403 : 401);
        }

        req.accessCriteria = accessCriteria;

        if (typeof next === 'function') {
            next();
        }
    }

    /**
     * @param {Response} res
     * @param {number} statusCode
     * @param {Object} responseData
     * @param {string} message
     * @return {Promise<e.Response>}
     */
    async returnResponse(
        res,
        statusCode,
        responseData = {},
        message = undefined
    ) {
        return res.status(statusCode).json({
            ...{message},
            ...responseData
        });
    }

    /**
     * @param {Response} res
     * @return {Promise<Response>}
     */
    async returnRecordNotFound(res) {
        return this.returnResponse(res, 404, {}, "Record not found");
    }

    /**
     * @param {e.Response} res
     * @param {number} statusCode
     * @return {Promise<e.Response>}
     */
    async returnAccessDenied(res, statusCode = 401) {
        return this.returnResponse(res, statusCode, {}, "Access denied!");
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @param validationRules
     * @return {Promise<*>}
     */
    async validate(req, res, next, validationRules = this.validationRules) {
        await Promise.all(validationRules.map(rule => rule.run(req)));
        const validationErrs = validationResult(req);
        const validationSuccesses = [];

        validationRules.forEach(rule => {
            if (!validationErrs.array()
                .some(error => error.path === rule.builder.fields[0])
            ) {
                validationSuccesses.push(rule.builder.fields[0]);
            }
        });


        if (!validationErrs.isEmpty()) {
            return this.returnResponse(
                res,
                400,
                {
                    validationErrs: validationErrs.array(),
                    validationSuccesses
                },
                "Validation failed. Fix your input and try again."
            );
        }

        req.validationSuccesses = validationSuccesses;
        next();
    }

    /**
     * @param {Request} req
     * @return {[Where]}
     */
    getFilters(req) {
        return [];
    }

    /**
     *
     * @param {Request} req
     * @return {string}
     */
    getSorting(req) {
        return 'id DESC';
    }

    /**
     * @param {Request} req
     * @param {number} totalRecordsCount
     * @return {{recordsPerPage: number, totalRecordsCount: number, nextPage: (number|null), totalPages: number, prevPage: (number|null), currentPage: number}}
     */
    getPagination(req, totalRecordsCount = 0) {
        const recordsPerPage = this._recordsPerPage;

        const totalPages = Math.ceil(totalRecordsCount / recordsPerPage);
        let page = Number(req.query.page);
        page = Number.isNaN(page) || page < 1 ? 1 : page;

        return {
            totalRecordsCount,
            recordsPerPage,
            currentPage: page,
            totalPages,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page >= 2 && page <= totalPages ? page - 1 : null
        };
    }

    /**
     * @param {Request} req
     * @return {{}}
     */
    getRequestBody(req) {
        const fields = {};
        Object.keys(req.body).forEach(key => {
            if (req.accessCriteria?.fields.includes(key)) {
                fields[key] = req.body[key];
            }
        });

        return fields;
    }

    /**
     *
     * @param {Request} req
     * @return {Promise<Record>}
     */
    async getRecordByIdAndAccessCriteria(req) {
        return await this.module.getRecords([], [
            ...req?.accessCriteria?.filter,
            ...[
                new Where(
                    'id',
                    '=',
                    Number(req.params.id)
                )
            ]
        ], 'id', 1);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async getAll(req, res, next) {
        try {
            let filters, sorting, pagination, offset;
            filters = this.getFilters(req);
            sorting = this.getSorting(req);

            filters = [
                ...req?.accessCriteria?.filter, 
                ...filters
            ];

            const totalRecords = await this.module.getRecordsCount(filters);
            if (this._recordsPerPage) {
                pagination = this.getPagination(req, totalRecords);
                offset = pagination.currentPage === 1 
                    ? 0 
                    : (pagination.currentPage - 1) * pagination.recordsPerPage;
            }

            const records = await this.module.getRecords(
                req?.accessCriteria?.fields,
                filters,
                sorting,
                pagination?.recordsPerPage,
                offset
            );

            return this.returnResponse(res, 200, {
                pagination,
                data: records.map(record => record.toJSON())
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
    async getById(req, res, next) {
        try {
            const record = await this.getRecordByIdAndAccessCriteria(req);
            if (!record) {
                return this.returnRecordNotFound(res);
            }

            return this.returnResponse(res, 200, {
                data: record.toJSON()
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

            let newRecord = this.module.createRecord(fields);
            await newRecord.save();

            newRecord = await this.module.getRecordById(newRecord.id);

            return res.status(201).json({
                data: newRecord.toJSON(),
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
    async update(req, res, next) {
        try {
            const record = await this.getRecordByIdAndAccessCriteria(req);
            if (!record) {
                return this.returnRecordNotFound(res);
            }

            Object.assign(record, this.getRequestBody(req));
            await record.save();

            return this.returnResponse(res, 200, {
                data: record.toJSON()
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
            const record = await this.getRecordByIdAndAccessCriteria(req);
            if (!record) {
                return this.returnRecordNotFound(res);
            }

            await record.delete();

            return this.returnResponse(res, 200, {
                data: record.toJSON()
            });
        } catch (e) {
            next(e);
        }
    }
}

export default Controller;