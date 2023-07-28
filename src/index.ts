require('dotenv').config();
import 'reflect-metadata';
import express from 'express';
import { createConnection } from 'typeorm';
import { User } from './entities/User';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { GreetingResolver } from './resolvers/greeting';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { UserResolver } from './resolvers/user';
import session from 'express-session';

import { Context } from './types/Context';

import cors from 'cors';
import mongoose from 'mongoose';
import { COOKIE_NAME, __prod__ } from './constant';
import MongoStore from 'connect-mongo';
import { Post } from './entities/Post';
import { PostResolver } from './resolvers/post';
import { Upvote } from './entities/Upvote';
import { buildDataLoaders } from './utils/dataLoader';
// import path from 'path';

const main = async () => {
    const connection = await createConnection({
        // type: 'postgres',
        // ...(__prod__ ? {url:process.env.DATABASE_URL} : {
        //     database: 'tabloid',
        //     username: process.env.DB_USERNAME_DEV,
        //     password: process.env.DB_PASSWORD_DEV,
        // }),
        // logging: true,
        // ...(__prod__ ? {
        //     extra: {
        //         ssl: {
        //             rejectUnauthorized:false,
        //         }
        //     },
        //     ssl: true
        // } : {}),
        // ...(__prod__ ? {} : {
        //     synchronize: true,
        // }),
        // entities: [User, Post, Upvote],
        // migrations: [path.join(__dirname, '/migrations/*')],
        type: 'postgres',
        database: 'tabloid',
        username: process.env.DB_USERNAME_DEV,
        password: process.env.DB_PASSWORD_DEV,
        logging: true,
        entities: [User, Post, Upvote],
        synchronize: true,
        // migrations: [path.join(__dirname, '/migrations/*')],
    });

    if (!__prod__) await connection.runMigrations();

    // send Email
    // App
    const app = express();

    // connect mongoose
    const mongoUrl = `mongodb+srv://thanhnguyendev:${process.env.MONGO_DB_PASSWORD}@cluster0.paf8mem.mongodb.net/tabloid-app?retryWrites=true&w=majority`;

    await mongoose.connect(mongoUrl);

    console.log('connectd mongodb');

    app.use(
        session({
            name: COOKIE_NAME,
            store: MongoStore.create({ mongoUrl }),
            cookie: {
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true,
                secure: __prod__,
                sameSite: 'lax',
                domain: __prod__ ? '.vercel.app' : undefined,
            },
            secret: process.env.SESSION_SECRET_DEV_PROD as string,
            saveUninitialized: false,
            resave: false,
        }),
    );

    //
    app.use(
        cors({
            origin: __prod__ ? process.env.CORS_ORIGIN_PROD : process.env.CORS_ORIGIN_DEV,
            credentials: true,
        }),
    );

    // Connect MongoDB

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [GreetingResolver, UserResolver, PostResolver],
            validate: false,
        }),
        context: ({ req, res }): Context => ({ req, res, connection, dataLoaders: buildDataLoaders() }),
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({ app, cors: false });

    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () =>
        console.log(
            `server started on port ${PORT} started server GraphQl on http://localhost:${PORT}${apolloServer.graphqlPath}`,
        ),
    );
};

main().catch((error) => console.log(error));
