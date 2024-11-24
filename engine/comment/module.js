import Module from "../module.js";
import CommentRecord from "./record.js";
import UserModule from "../user/module.js";
import Where from "../database/where.js";

class CommentModule extends Module {
    constructor() {
        super(
            'comments',
            [
                'id',
                'postId',
                'commentId',
                'createdById',
                'content',
                'isBest',
                'status',
                'createdAt'
            ],
            CommentRecord
        );
    }

    /**
     * @param {number} commentId
     * @return {Promise<Record[]|Record>}
     */
    async getSubCommentsByCommentId(commentId) {
        return this.getRecords([], [
            new Where('commentId', '=', commentId)
        ]);
    }

    /**
     * @param {number} postId
     * @return {Promise<Record[]|Record>}
     */
    async getCommentsByPost(postId) {
        return this.getRecords([], [
            new Where('postId', '=', postId)
        ]);
    }

    /**
     * @param {number} userId
     * @return {Promise<UserRecord>}
     */
    async getAuthor(userId) {
        return (new UserModule()).getRecordById(userId);
    }
}

export default CommentModule;