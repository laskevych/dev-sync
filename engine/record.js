class Record {
    #module;
    #visibleFields = [];

    /**
     * @param {Module} module
     * @param {Object} data
     */
    constructor(module, data = {}) {
        this.#module = module;
        if (data) {
            for (const key in data) {
                if (this.module.fields.includes(key)) {
                    this[key] = data[key];
                }
            }
        }

        this.visibleFields = [...this.module.fields];
    }

    /**
     * @return {Module}
     */
    get module() {
        return this.#module;
    }

    /**
     * @return {[string]}
     */
    get visibleFields() {
        return this.#visibleFields;
    }

    /**
     * @param {[string]} fields
     */
    set visibleFields(fields) {
        this.#visibleFields = fields;
    }

    getAdditionalFields() {
        return {};
    }

    async prepareAdditionalFields() {
        if (typeof this.getAdditionalFields === 'function') {
            const additionalFields = this.getAdditionalFields();
            await Promise.all(
                Object.keys(additionalFields)
                    .map(async (field) => this[field] = await additionalFields[field]())
            );
        }
    }

    async save() {
        const fields = Object.keys(this).filter(key => this.module.fields.includes(key));
        const values = fields.map(field => this[field]);

        if (this.id) {
            const params = fields.map(field => `${field} = ?`).join(', ');
            await this.module.db.query(`UPDATE ${this.module.table} SET ${params} WHERE id = ?`, [...values, this.id]);
        } else {
            const params = fields.join(', ');
            const placeholders = fields.map(() => '?').join(', ');
            const [result] = await this.module.db.query(`INSERT INTO ${this.module.table} (${params}) VALUES (${placeholders})`, values);
            this.id = result.insertId;
        }
    }

    async delete() {
        if (this.id) {
            await this.module.db.query(`DELETE FROM ${this.module.table} WHERE id = ${this.id}`);
        }
    }

    /**
     * @return {Object}
     */
    toJSON() {
        const jsonRecord = {};
        this.visibleFields.forEach(field => {
            if (this[field] === null || this[field] === undefined) {
                return;
            }

            let value = this[field];
            if (Array.isArray(value)) {
                value = value.map(item => {
                    if (typeof item === 'object' && (item instanceof Record || item?.constructor?.name === 'Record')) {
                        return item.toJSON();
                    }
                })
            } else if (typeof value === 'object' && (value?.constructor?.name === 'Record' || value instanceof Record)) {
                value = value.toJSON();
            }

            jsonRecord[field] = value;
        });

        return jsonRecord;
    }

}

export default Record;