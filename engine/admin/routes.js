import AdminJS from 'adminjs'
import Adapter, { Database, Resource } from '@adminjs/sql'
import Plugin from '@adminjs/express'
import UserModule from "../user/module.js";
import { dark, light, noSidebar } from '@adminjs/themes'

AdminJS.registerAdapter({
    Database,
    Resource,
});


const db = await new Adapter('mysql2', {
    database: process.env.DB_NAME || 'DevSync',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306
}).init();

const routes = new AdminJS({
    defaultTheme: dark.id,
    availableThemes: [dark, light, noSidebar],
    databases: [db],
    resources: [
        {
            resource: db.resourceMap.get('posts'),
            options: {
                properties: {
                    content: {
                        isVisible: { edit: false, show: true, list: true, filter: true },
                        isDisabled: true,
                        isEditable: false,
                    },
                },
            },
        },
        {
            resource: db.resourceMap.get('comments'),
            options: {
                properties: {
                    content: {
                        isVisible: { edit: false, show: true, list: true, filter: true },
                        isDisabled: true,
                        isEditable: false,
                    },
                    rating: {
                        isVisible: { edit: false, show: true, list: true, filter: true },
                        isDisabled: true,
                        isEditable: false,
                    },
                },
            },
        },
        {
            resource: db.resourceMap.get('users'),
            options: {
                properties: {
                    password: {
                        isVisible: { edit: false, show: false, list: false, filter: false },
                        isDisabled: true,
                        isEditable: false,
                    },
                    profilePicture: {
                        isVisible: { edit: false, show: false, list: false, filter: false },
                        isDisabled: true,
                        isEditable: false,
                    },
                },
            },
        },
    ],
    rootPath: '/admin'
});

const authenticate = async (email, password) => {
    const module = new UserModule();
    const user = await module.getByEmail(email);

    if (
        !user
        || !user.isAdmin()
    ) {
        return null;
    }

    const checkPassword = await module.isValidPassword(password, user.password);
    if (!checkPassword) {
        return null;
    }

    return Promise.resolve({ email, password });
};

const router = Plugin.buildAuthenticatedRouter(
    routes,
    {
        authenticate,
        cookiePassword: process.env.APPLICATION_SECRET,
        cookieName: 'admin-js',
    },
    null,
    { resave: true, saveUninitialized: true }
);

routes.watch();

export default router;