import Controller from './../../controller.js';
import PostFavoritesModule from "./module.js";
import Where from "../../database/where.js";

class PostFavoriteController extends Controller {
    constructor() {
        super(new PostFavoritesModule());
    }

    /**
     * @return {PostFavoritesModule}
     */
    get module() {
        return super.module;
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<Response>}
     */
    async deleteFavoriteByPostId(req, res, next) {
        try {
            const filters = [
                ...req?.accessCriteria?.filter,
                ...[
                    new Where(
                        'postId',
                        '=',
                        Number(req.params.postId)
                    )
                ]];
            const favorite = await this.module.getRecords([], filters, 'id', 1);
            if (!favorite) {
                return this.returnRecordNotFound(res);
            }
            await favorite.delete();

            return this.returnResponse(res, 200);
        } catch (e) {
            next(e);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @return {Promise<Response>}
     */
    async createFavoriteByPostId(req, res, next) {
        try {
            req.body.postId = Number(req.params.postId);

            const fields = this.getRequestBody(req);
            if (this.module.fields.includes(this.module.createdByField)) {
                fields[this.module.createdByField] = req.user.id;
            }

            const currentFavorites = await this.module.getPostIdsByUser(req.user.id);
            if (currentFavorites.includes(Number(req.body.postId))) {
                return this.returnResponse(res, 400, {}, 'Record is exist!!!');
            }

            const newRecord = await this.module.createRecord(fields);
            await newRecord.save();

            return this.returnResponse(res, 201, { data: newRecord.toJSON() });
        } catch (e) {
            next(e);
        }
    }
}

export default new PostFavoriteController();