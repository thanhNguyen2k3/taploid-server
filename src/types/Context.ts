import { Session, SessionData } from 'express-session';
import { Request, Response } from 'express';
import { Connection } from 'typeorm';
import { buildDataLoaders } from '../utils/dataLoader';

export type Context = {
    req: Request & { session: Session & Partial<SessionData> & { userId?: number } };
    res: Response;
    connection: Connection;
    dataLoaders: ReturnType<typeof buildDataLoaders>;
};
