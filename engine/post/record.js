import Record from "../record.js";

class PostRecord extends Record {
    constructor(module, data = {}) {
        super(module, data);

        this.visibleFields.push(
            'author',
            'categories',
            'commentsCount'
        );
    }

    /**
     * @return {PostModule}
     */
    get module() {
        return super.module;
    }

    getAdditionalFields() {
        return {
            author: async () => await this.module.getAuthor(this.createdById),
            commentsCount: async () => await this.module.getCommentsCountByPost(this.id),
            categories: async () => await this.module.getCategoriesByPostId(this.id)
        };
    }

    async recalculateLikes() {
        if (this.id) {
            await this.module.recalculateLikesByPostId(this.id);
        }
    }
}

export default PostRecord;