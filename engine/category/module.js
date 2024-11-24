import Module from "../module.js";
import CategoryRecord from "./record.js";

class CategoryModule extends Module {
    constructor() {
        super(
            'categories',
            [
                'id',
                'title',
                'description',
                'createdAt'
            ],
            CategoryRecord
        );
    }
}

export default CategoryModule;