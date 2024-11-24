import Module from "../module.js";
import UserRecord from "./record.js";
import PostModule from "../post/module.js";
import LikeModule from "../like/module.js";
import CommentModule from "../comment/module.js";
import Where from "../database/where.js";
import * as argon2 from "argon2";

class UserModule extends Module {
    constructor() {
        super(
            'users',
            [
                'id',
                'login',
                'email',
                'fullName',
                'password',
                'isEmailVerified',
                'profilePicture',
                'rating',
                'role',
                'createdAt'
            ],
            UserRecord
        );
    }

    /**
     * @param {string} email
     * @return {Promise<UserRecord>}
     */
    async getByEmail(email) {
        return this.getRecords([], [new Where('email', '=', email)], 'id', 1);
    }

    /**
     * @param {string} login
     * @return {Promise<UserRecord>}
     */
    async getByLogin(login) {
        return this.getRecords([], [new Where('login', '=', login)], 'id', 1);
    }

    /**
     * @param {string} password
     * @param {string} passwordHash
     * @return {Promise<boolean>}
     */
    async isValidPassword(password, passwordHash) {
        return await argon2.verify(passwordHash, password);
    }

    /**
     * @param {string} password
     * @return {Promise<String>}
     */
    async createPassword(password) {
        return await argon2.hash(password, {
            salt: Buffer.from(process.env.APPLICATION_SECRET)
        });
    }

    /**
     * @param {number} userId
     * @return {Promise<void>}
     */
    async recalculateRatingByUserId(userId) {
        const user = await this.getRecordById(userId);
        if (!user) {
            return;
        }

        const postModule = new PostModule();
        const commentModule = new CommentModule();
        const likeModule = new LikeModule();

        const posts = await postModule.getRecords([], [
            new Where(postModule.createdByField, '=', userId)
        ]);

        const comments = await commentModule.getRecords([], [
            new Where(commentModule.createdByField, '=', userId)
        ]);

        let rating = 0;
        if (posts.length > 0) {
            const postLikes = await likeModule.getRecords([], [new Where('postId', 'IN', posts.map(post => post.id))]);
            postLikes.forEach(like => {
                !like.isLike() ? rating-- : rating++;
            });
        }

        if (comments.length > 0) {
            const commentLikes = await likeModule.getRecords([], [new Where('commentId', 'IN', comments.map(comment => comment.id))]);
            commentLikes.forEach(like => {
                !like.isLike() ? rating-- : rating++;
            });
        }

        user.rating = rating;
        await user.save();
    }
}

export default UserModule;