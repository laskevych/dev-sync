import Record from "../record.js";

class CommentRecord extends Record {
    /**
     * @param {CommentModule} module
     * @param {Object} data
     */
    constructor(module, data = {}) {
        super(module, data);

        this.visibleFields.push(
            'author',
            'comments'
        );
    }

    /**
     * @return {CommentModule}
     */
    get module() {
        return super.module;
    }

    getAdditionalFields() {
        return {
            author: async () => await this.module.getAuthor(this.createdById),
            comments: async () => await this.module.getSubCommentsByCommentId(this.id),
        };
    }
}

export default CommentRecord;