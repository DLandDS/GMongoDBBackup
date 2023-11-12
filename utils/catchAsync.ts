import { NextFunction, Request, Response } from "express";
import log from "../log/log";

export type ControllerCallback = (req: Request<any>, res: Response<any>, next?: NextFunction) => Promise<void>;

const catchAsync = ((callback: ControllerCallback) => {
    return (async (req: Request & { timestamp: number } , res: Response, next: NextFunction) => {
        try {
            await callback(req, res, next);
            if(res.writableEnded){
                log("INFO", `${req.method} ${req.originalUrl} - ${res.statusCode} ${Date.now() - req.timestamp}ms`);
            }
        } catch (error) {
            next(error);
        }
    }) as ControllerCallback
});

export default catchAsync;