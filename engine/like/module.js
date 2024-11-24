import Module from "../module.js";
import LikeRecord from "./record.js";
import Where from "../database/where.js";
import UserModule from "../user/module.js";

class LikeModule extends Module {
    constructor() {
        super(
            'likes',
            [
                'id',
                'postId',
                'commentId',
                'createdById',
                'type',
                'postId',
                'createdAt'
            ],
            LikeRecord
        );
    }

    /**
     * @param {string} moduleName
     * @param {number} recordId
     * @return {Promise<LikeRecord[]>}
     */
    async getLikesByRecordId(moduleName, recordId) {
        return this.getRecords([], [
            new Where(moduleName, '=',recordId)
        ]);
    }
    
    /**
     * @param {number} userId
     * @return {Promise<UserRecord>}
     */
    async getAuthor(userId) {
        return (new UserModule()).getRecordById(userId);
    }

    /**
     * @param {number} createdById
     * @param {string} moduleName
     * @param {number} recordId
     * @return {Promise<LikeRecord>}
     */
    async getLikeByCreatedByIdAndPostOrCommentId(createdById, moduleName, recordId) {
        return this.getRecords([], [
                new Where(moduleName, '=', recordId),
                new Where(this.createdByField, '=', createdById)
            ],
            'id',
            1
        );
    }
}

export default LikeModule;