import Record from "../record.js";

class LikeRecord extends Record {
    /**
     * @param {LikeModule} module
     * @param {Object} data
     */
    constructor(module, data = {}) {
        super(module, data);

        this.visibleFields.push('author');
    }

    isLike() {
        return this.type === 'like';
    }

    getAdditionalFields() {
        return {
            author: async () => await this.module.getAuthor(this.createdById)
        };
    }
}

export default LikeRecord;