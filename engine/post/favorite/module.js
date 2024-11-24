import Module from "../../module.js";
import Where from "../../database/where.js";

class PostFavoritesModule extends Module {
    constructor() {
        super(
            'posts_favorites',
            [
                'id',
                'postId',
                'createdById',
                'createdAt'
            ]
        );
    }

    /**
     * @param {number} userId
     * @return {Promise<*[number]>}
     */
    async getPostIdsByUser(userId) {
        const records = await this.getRecords([], [new Where(this.createdByField, '=', userId)]);
        return records.map(record => record.postId);
    }
}

export default PostFavoritesModule;