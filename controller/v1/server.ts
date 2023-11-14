import { Request, Response, Router } from "express";
import catchAsync from "../../utils/catchAsync";
import validate from "../../middleware/validate";
import Joi from "joi";
import Database from "../../database";
import httpStatus from "http-status";
import ApiError from "../../utils/apiError";

const router = Router();

router.route("/")
    .get(validate({}), catchAsync(async (req, res) => {
        const record = await Database.server.findMany();
        res.status(200).send(record)
    }))

    .post(validate({
        body: Joi.object().keys({
            name: Joi.string().required(),
            uri: Joi.string().required(),
            interval: Joi.number().required(),
        })
    }), catchAsync(async (req: Request, res: Response) => {
        const record = await Database.server.create({ data: {
            ...req.body,
            lastBackup: new Date(0),
        } });
        res.status(201).send(record);
    }))

router.route("/:id")
    .get(validate({
        params: Joi.object().keys({
            id: Joi.number().required(),
        })
    }), catchAsync(async (req, res) => {
        const record = await Database.server.findUnique({
            where: {
                id: req.params.id
            }
        });
        if(!record) {
            throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
        }
        res.send(record)
    }))

    .delete(validate({
        params: Joi.object().keys({
            id: Joi.number().required(),
        })
    }), catchAsync(async (req, res) => {
        const record = await Database.server.findUnique({
            where: {
                id: req.params.id
            }
        });
        if(!record) {
            throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
        }
        await Database.server.delete({
            where: {
                id: req.params.id
            }
        });
        res.status(httpStatus.NO_CONTENT).end();
    }))

    .put(validate({
        params: Joi.object().keys({
            id: Joi.number().required(),
        }),
        body: Joi.object().keys({
            name: Joi.string().required(),
            uri: Joi.string().required(),
            interval: Joi.number().required(),
        })
    }), catchAsync(async (req, res) => {
        const record = await Database.server.findUnique({
            where: {
                id: req.params.id
            }
        });
        if(!record) {
            throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
        }
        const updatedRecord = await Database.server.update({
            where: {
                id: req.params.id
            },
            data: req.body
        });
        res.status(201).send(updatedRecord);
    }))

export default router;