import db from './database/db.js';
import Record from './record.js';
import Where from './database/where.js';

class Module {
    #db;
    #table;
    #fields;
    #recordClass = Record;
    #createdByField = 'createdById';

    /**
     * @param {string} table
     * @param {[string]} fields
     * @param {Record} recordClass
     */
    constructor(
        table,
        fields = ['id', 'createdAt'],
        recordClass = undefined
    ) {
        this.#db = db;
        this.#table = table;
        this.#fields = fields;
        if (recordClass) {
            this.#recordClass = recordClass;
        }
    }
    
    get db() {
        return this.#db;
    }

    /**
     * @return {string}
     */
    get table() {
        return this.#table;
    }

    /**
     * @return {[string]}
     */
    get fields() {
        return this.#fields;
    }

    /**
     * @return {Record}
     */
    get recordClass() {
        return this.#recordClass;
    }

    /**
     * @return {string}
     */
    get createdByField() {
        return this.#createdByField;
    }

    /**
     * @param {[string]} fields
     * @return {string}
     * @private
     */
    _prepareSelect(fields = []) {
        fields = fields.length === 0
            ? this.fields
            : fields;

        return `SELECT ${fields.join(', ')} FROM \`${this.table}\``;
    }

    /**
     * @param {[Where|[Where]]} where
     * @return {string}
     */
    async _prepareWhere(where) {
        let filter = '';
        for (let i = 0; i < where.length; i++) {
            if (filter === '') {
                filter = 'WHERE ';
            }

            if (Array.isArray(where[i])) {
                let orSlice = where[i].map(item => item.toString()).join(' OR ');
                filter += `(${orSlice})`;
            } else {
                filter += where[i].toString();
            }

            if (
                !Array.isArray(where[i + 1])
                && typeof where[i + 1] === "object"
            ) {
                filter += ' AND ';
            }
        }

        return filter;
    }

    /**
     * @param {string} orderBy
     * @return {string}
     * @private
     */
    _prepareOrderBy(orderBy) {
        return orderBy
            ? `ORDER BY ${orderBy}`
            : '';
    }

    /**
     * @param {number} limit
     * @return {string}
     * @private
     */
    _getLimit(limit) {
        return limit
            ? `LIMIT ${limit}`
            : '';
    }

    /**
     * @param {number} offset
     * @return {string}
     * @private
     */
    _prepareOffset(offset) {
        return offset
            ? `OFFSET ${offset}`
            : '';
    }

    /**
     * @param {Object} data
     * @return {Record}
     */
    createRecord(data = {}) {
        const recordClass = this.recordClass;
        return new recordClass(this, data);
    }

    /**
     * @param {[string]} fields
     * @param {[Where|[Where]]} where
     * @param {string} orderBy
     * @param {number} limit
     * @param {number} offset
     * @return {Promise<[Record]|Record>}
     */
    async getRecords(
        fields = [],
        where = [],
        orderBy = 'id',
        limit = undefined,
        offset = undefined
    ) {
        let query = `
            ${this._prepareSelect(fields)}
            ${await this._prepareWhere(where)}
            ${this._prepareOrderBy(orderBy)}
            ${this._getLimit(limit)}
            ${this._prepareOffset(offset)}
        `;

        const [rawRecords] = await this.db.query(query);

        const records = rawRecords.map(item => {
            return this.createRecord(item);
        });

        for (const record of records) {
            await record.prepareAdditionalFields();
        }

        if (limit === 1) {
            return records.length === 1 ? records[0] : null;
        } else {
            return records;
        }
    }

    /**
     * @param {[Where|[Where]]} where
     * @return {Promise<number>}
     */
    async getRecordsCount(where) {
        const [result] = await this.db.query(`SELECT COUNT(\`id\`) AS amount FROM ${this.table} ${await this._prepareWhere(where)}`);
        return result[0].amount;
    }

    /**
     * @param {number} id
     * @return {Promise<Record>}
     */
    async getRecordById(id) {
        return await this.getRecords(
            [],
            [new Where('id', '=', id)],
            'id',
            1
        );
    }
}

export default Module;