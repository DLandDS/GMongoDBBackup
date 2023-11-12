import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config';
import { errorMiddleware, notFoundMiddleware, timeMiddleware } from './middleware/log';
import catchAsync from './utils/catchAsync';
import v1Router from './controller/v1';
import Database from './database';
import log from './log/log';

const app = express();

// Enable CORS
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(timeMiddleware);

app.get('/', catchAsync(async (req: Request, res: Response) => {
    res.send('Hello World!');
}));

app.use('/v1', v1Router);

app.use(notFoundMiddleware);

app.use(errorMiddleware);


Database.$connect().then(() => {
    log('INFO', 'Database connected');
    app.listen(config.port, () => {
        log('INFO', `Server is listening on port ${config.port}`)
    });
}).catch((err) => {
    log('ERROR', 'Database connection failed');
    console.log(err);
});