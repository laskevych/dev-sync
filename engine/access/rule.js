import AccessCriteria from "./criteria.js";
import Where from "../database/where.js";

class AccessRule {
    #module;
    create;
    read;
    update;
    delete;

    /**
     * @param {Module} module
     */
    constructor(module) {
        this.#module = module;
    }
    
    /**
     *
     * @param {string} name
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    #setCriteriaByName(name, fields = [], filter = []) {
        this[name] = {
            fields: fields.length === 0
                ? this.#module.fields
                : fields,
            filter
        }

        return this;
    }

    #removeAccessForCriteria(criteriaName) {
        this[criteriaName] = undefined;
        return this;
    }

    /**
     * @param {string} name
     * @param {UserRecord} user
     * @return {AccessCriteria}
     */
    #getCriteriaByName(name, user = undefined) {
        let accessCriteria;
        if (this[name]) {
            accessCriteria = new AccessCriteria(
                this[name].fields,
                this.#createFilters(
                    this[name].filter,
                    user
                )
            );
        }

        return accessCriteria;
    }

    #createFilters(filters = [], user = undefined) {
        const result = [];
        filters.forEach(filter => {
            if (Array.isArray(filter)) {
                result.push(this.#createFilters(filter, user));
            } else {
                result.push(
                    new Where(
                        filter.field,
                        filter.operator,
                        filter.field === this.#module.createdByField
                            ? user?.id
                            : filter.value
                    )
                );
            }
        });

        return result;
    }

    /**
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    setCreate(fields = [], filter = []) {
        return this.#setCriteriaByName('create', fields, filter);
    }

    /**
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    setRead(fields = [], filter = []) {
        return this.#setCriteriaByName('read', fields, filter);
    }

    /**
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    setUpdate(fields = [], filter = []) {
        return this.#setCriteriaByName('update', fields, filter);
    }

    /**
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    setDelete(fields = [], filter = []) {
        return this.#setCriteriaByName('delete', fields, filter);
    }

    /**
     * @param {UserRecord} user
     * @return {AccessCriteria}
     */
    getCreate(user = undefined) {
        return this.#getCriteriaByName('create', user);
    }

    /**
     * @param {UserRecord} user
     * @return {AccessCriteria}
     */
    getRead(user = undefined) {
        return this.#getCriteriaByName('read', user);
    }

    /**
     * @param {UserRecord} user
     * @return {AccessCriteria}
     */
    getUpdate(user = undefined) {
        return this.#getCriteriaByName('update', user);
    }

    /**
     * @param {UserRecord} user
     * @return {AccessCriteria}
     */
    getDelete(user = undefined) {
        return this.#getCriteriaByName('delete', user);
    }

    removeCreate() {
        return this.#removeAccessForCriteria('create');
    }

    removeRead() {
        return this.#removeAccessForCriteria('read');
    }

    removeUpdate() {
        return this.#removeAccessForCriteria('update');
    }

    removeDelete() {
        return this.#removeAccessForCriteria('delete');
    }

    removeAll() {
        return this
            .removeCreate()
            .removeRead()
            .removeUpdate()
            .removeDelete();
    }
}

export default AccessRule;
