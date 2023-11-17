import e, { NextFunction, Request, Response } from "express";
import log from "../log/log";
import ApiError from "../utils/apiError";

export const timeMiddleware = ((req: Request & { timestamp: number }, res: Response, next: NextFunction) => {
    req.timestamp = Date.now();
    next();
}) as (req: Request, res: Response, next: NextFunction) => void;;

export const errorMiddleware = ((error: ApiError, req: Request & { timestamp: number }, res: Response, next: NextFunction) => {
    res.status(error.status || 500).send({
        status: error.status || 500,
        message: error.message || "Internal Server Error"
    });
    log("ERROR", `${req.method} ${req.originalUrl} - ${res.statusCode} ${Date.now() - req.timestamp}ms`, error);
}) as (error:any, req: Request, res: Response, next: NextFunction) => void;


export const notFoundMiddleware = ((req: Request, res: Response, next: NextFunction) => {
    next(new ApiError(404, "Not Found"));
}) as (req: Request, res: Response, next: NextFunction) => void;