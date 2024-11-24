import Record from "../record.js";

class UserRecord extends Record {
    /**
     * @param {UserModule} module
     * @param {Object} data
     */
    constructor(module, data = {}) {
        super(module, data);
    }

    /**
     * @return {UserModule}
     */
    get module() {
        return super.module;
    }

    isAdmin() {
        return this.role === 'admin';
    }

    toJSON(allowedAllFields = false) {
        const result = super.toJSON(allowedAllFields);
        delete result?.password;
        return result;
    }

    /**
     * @return {Promise<void>}
     */
    async recalculateRating() {
        if (this.id) {
            await this.module.recalculateRatingByUserId(this.id);
        }
    }
}

export default UserRecord;