import { Request, Response, Router } from "express";
import catchAsync from "../../utils/catchAsync";
import validate from "../../middleware/validate";
import Joi from "joi";
import Database from "../../database";
import httpStatus from "http-status";
import ApiError from "../../utils/apiError";
import { scheduleService, terminalService } from "../../service";

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
            gdriveDirId: Joi.string().optional().empty(""),
        })
    }), catchAsync(async (req: Request, res: Response) => {
        const record = await Database.server.create({ data: {
            ...req.body,
            lastBackup: new Date(0),
        } });
        await scheduleService.activate(record.id);
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
            gdriveDirId: Joi.string().optional().empty("").default(null),
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
        //set data to database
        const updatedRecord = await Database.server.update({
            where: {
                id: req.params.id
            },
            data: req.body,
            
        });
        res.status(201).send(updatedRecord);
    }))

router.route("/:id/log")
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
    const terminal = terminalService.getTerminal(req.params.id);
    res.send({ log: terminal?.getLog().getLog().join("") || "" });
}))

router.route("/:id/log/stream")
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
    const terminal = terminalService.getTerminal(req.params.id);
    if(!terminal) {
        throw new ApiError(httpStatus.NOT_FOUND, "Terminal not found!");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const listener = (log: string) => {
        res.write(`data: ${log}\n\n`);
    }

    terminal.getLog().addListener(listener);

    res.on("close", () => {
        terminal.getLog().removeListener(listener);
    });

}))

export default router;