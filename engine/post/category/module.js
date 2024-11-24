import Module from "../../module.js";
import Where from "../../database/where.js";
import CategoryModule from "../../category/module.js";

class PostCategoryModule extends Module {
    constructor() {
        super(
            'posts_categories',
            [
                'id',
                'categoryId',
                'postId',
                'createdAt'
            ]
        );
    }

    async saveCategories(postId, categoriesIds) {
        const postCategories = await this.getRecords([], [new Where('postId', '=', postId)]);

        if (categoriesIds.size > 0) {
            for (const postCategory of postCategories) {
                if (!categoriesIds.has(postCategory.categoryId)) {
                    await postCategory.delete();
                } else {
                    categoriesIds.delete(postCategory.categoryId);
                }
            }

            const categoryModule = new CategoryModule();
            for (const id of categoriesIds) {
                const category = await categoryModule.getRecordById(id);
                if (category) {
                    const postCategory = this.createRecord({ postId: postId, categoryId: id });
                    await postCategory.save();
                }
            }
        } else if (categoriesIds.size === 0) {
            for (const postCategory of postCategories) {
                await postCategory.delete();
            }
        }
    }

    /**
     * @param {number} postId
     * @return {Promise<Record[]>}
     */
    async getCategoriesByPostId(postId) {
        const postCategories = await this.getRecords([], [ new Where('postId', '=', postId) ]);
        if (postCategories.length) {
            return (new CategoryModule()).getRecords([], [ new Where('id', 'IN', postCategories.map(postCategory => postCategory.categoryId))]);
        } else {
            return [];
        }
    }
}

export default PostCategoryModule;