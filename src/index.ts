import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config';
import { errorMiddleware, notFoundMiddleware, timeMiddleware } from './middleware/log';
import catchAsync from './utils/catchAsync';
import v1Router from './controller/v1';
import Database from './database';
import log from './log/log';
import drive from './gdrive';
import { scheduleService } from './service';

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

try {
    await Database.$connect();
    log('INFO', 'Database connected')
    try {
        await drive.files.list();
        log('INFO', 'Google Drive connected');
        await scheduleService.init();
        app.listen(config.port, () => {
            log('INFO', `Server is listening on port ${config.port}`)
        });
    } catch (err: any) {
        log('ERROR', 'Google Drive connection failed', err);
    }
} catch (err: any) {
    log('ERROR', 'Database connection failed', err);
}
