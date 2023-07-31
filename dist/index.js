"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const greeting_1 = require("./resolvers/greeting");
const apollo_server_core_1 = require("apollo-server-core");
const user_1 = require("./resolvers/user");
const express_session_1 = __importDefault(require("express-session"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const constant_1 = require("./constant");
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const Post_1 = require("./entities/Post");
const post_1 = require("./resolvers/post");
const Upvote_1 = require("./entities/Upvote");
const dataLoader_1 = require("./utils/dataLoader");
const path_1 = __importDefault(require("path"));
const main = async () => {
    const connection = await (0, typeorm_1.createConnection)(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ type: 'postgres' }, (constant_1.__prod__
        ? { url: process.env.POSTGRES_URL }
        : {
            database: 'tabloid',
            username: process.env.DB_USERNAME_DEV,
            password: process.env.DB_PASSWORD_DEV,
        })), { logging: true }), (constant_1.__prod__
        ? {
            extra: {
                ssl: {
                    rejectUnauthorized: false,
                },
            },
            ssl: true,
        }
        : {})), (constant_1.__prod__
        ? {}
        : {
            synchronize: true,
        })), { entities: [User_1.User, Post_1.Post, Upvote_1.Upvote], migrations: [path_1.default.join(__dirname, 'src/migrations/*')] }));
    if (!constant_1.__prod__)
        await connection.runMigrations();
    const app = (0, express_1.default)();
    app.use(express_1.default.static('public'));
    const mongoUrl = `mongodb+srv://thanhnguyendev:${process.env.MONGO_DB_PASSWORD}@cluster0.paf8mem.mongodb.net/tabloid-app?retryWrites=true&w=majority`;
    await mongoose_1.default.connect(mongoUrl);
    console.log('connectd mongodb');
    app.use((0, express_session_1.default)({
        name: constant_1.COOKIE_NAME,
        store: connect_mongo_1.default.create({ mongoUrl }),
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            secure: constant_1.__prod__,
            sameSite: 'lax',
            domain: constant_1.__prod__ ? '.vercel.app' : undefined,
        },
        secret: process.env.SESSION_SECRET_DEV_PROD,
        saveUninitialized: false,
        resave: false,
    }));
    app.use((0, cors_1.default)({
        origin: constant_1.__prod__ ? process.env.CORS_ORIGIN_PROD : process.env.CORS_ORIGIN_DEV,
        credentials: true,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [greeting_1.GreetingResolver, user_1.UserResolver, post_1.PostResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ req, res, connection, dataLoaders: (0, dataLoader_1.buildDataLoaders)() }),
        plugins: [(0, apollo_server_core_1.ApolloServerPluginLandingPageGraphQLPlayground)()],
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app, cors: false });
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => console.log(`server started on port ${PORT} started server GraphQl on http://localhost:${PORT}${apolloServer.graphqlPath}`));
};
main().catch((error) => console.log(error));
//# sourceMappingURL=index.js.map