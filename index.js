import express from 'express';
import * as path from "path";
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
// eslint-disable-next-line no-use-before-define
import swaggerDocs from './documentation/openapi.json' with { type: 'json' }; // eslint-disable-line

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as jwtMiddleware from './engine/auth/middlewares/JSONWebToken.js';
import userRouter from './engine/user/routes.js';
import postRouter from './engine/post/routes.js';
import categoryRouter from './engine/category/routes.js';
import commentRouter from './engine/comment/routes.js';
import authRoutes from './engine/auth/routes.js';
import adminRoutes from './engine/admin/routes.js';

function checkEnvVariablesPresence() {
    let isCorrect = true;
    ['APPLICATION_SECRET', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].some(item => {
        if (!process.env.hasOwnProperty(item)) {
            isCorrect = false;
        }
    });

    return isCorrect;
}

if (!checkEnvVariablesPresence()) {
    console.error(`Fill in the correct environment variables in the .env file. Stop leaving things unfinished!`);
    process.exit(1);
}

const app = express();

app.use('/admin', adminRoutes);
app.use('/swagger-docs',
    swaggerUI.serve,
    swaggerUI.setup(swaggerDocs)
);

app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

app.use('/api/auth/', jwtMiddleware.setUserByJWT, authRoutes);
app.use('/api/users/', jwtMiddleware.setUserByJWT, userRouter);
app.use('/api/categories/', jwtMiddleware.setUserByJWT, categoryRouter);
app.use('/api/comments/', jwtMiddleware.setUserByJWT, commentRouter);
app.use('/api/posts/', jwtMiddleware.setUserByJWT, postRouter);

app.all('*', (req, res) => {
    return res.status(404).json({ message: "Endpoint not found. Check the URL and try again." });
});

function handleInternalError(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error. Something’s broken—probably your setup.',
        error: err.message
    });
}

app.use(handleInternalError);

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`📍 Admin: http://localhost:${PORT}/admin/`);
    console.log(`📍 API Docs: http://localhost:${PORT}/swagger-docs/`);
});