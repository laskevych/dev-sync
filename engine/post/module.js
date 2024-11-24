import Module from "../module.js";
import PostRecord from "./record.js";
import PostCategoryModule from "./category/module.js";
import CommentModule from "../comment/module.js";
import UserModule from "../user/module.js";
import LikeModule from "../like/module.js";
import Where from "../database/where.js";

class PostModule extends Module {
    constructor() {
        super(
            'posts',
            [
                'id',
                'title',
                'content',
                'isTop',
                'status',
                'likes',
                'createdById',
                'createdAt'
            ],
            PostRecord
        );
    }

    /**
     *
     * @param {[Where|[Where]]} where
     * @return {string}
     */
    async _prepareWhere(where) {
        const postCategoryModule = new PostCategoryModule();
        for (const item of where) {
            if (item.field === 'categories') {
                const postCategories = await postCategoryModule.getRecords([], [
                    new Where('categoryId', 'IN', item.value)
                ]);

                const postIds = postCategories.map(postCategory => postCategory.postId);

                item.field = 'id';
                item.condition = 'IN';
                item.value = postIds.length === 0 ? [0] : postIds;
            }
        }

        return super._prepareWhere(where);
    }

    /**
     * @param {number} postId
     * @return {Promise<void>}
     */
    async recalculateLikesByPostId(postId) {
        const post = await this.getRecordById(postId);
        if (!post) {
            return;
        }

        const likeModule = new LikeModule();

        let numberOfLikes = 0;
        const likes = await likeModule.getLikesByRecordId('postId', postId);
        likes.forEach(like => {
            if (like.isLike()) {
                numberOfLikes++;
            }
        });

        post.likes = numberOfLikes;
        await post.save();
    }

    /**
     * @inheritDoc
     * @return {Promise<PostRecord[]|PostRecord>}
     */
    async getRecords(fields = [], where = [], orderBy = 'id', limit = undefined, offset = undefined) {
        return super.getRecords(fields, where, orderBy, limit, offset);
    }

    /**
     * @param {number} userId
     * @return {Promise<UserRecord>}
     */
    async getAuthor(userId) {
        return (new UserModule()).getRecordById(userId);
    }

    /**
     * @param {number} postId
     * @return {Promise<CategoryRecord[]>}
     */
    async getCategoriesByPostId(postId) {
        return (new PostCategoryModule()).getCategoriesByPostId(postId);
    }

    /**
     * @param {number} postId
     * @return {Promise<number>}
     */
    async getCommentsCountByPost(postId) {
        const comments = await (new CommentModule()).getCommentsByPost(postId);
        return comments.length;
    }
}

export default PostModule;