import { Router } from "express";
import validate from "../../middleware/validate";
import Joi from "joi";
import Database from "../../database";
import httpStatus from "http-status";
import ApiError from "../../utils/apiError";
import { actionService, scheduleService, terminalService } from "../../service";
import catchAsync from "../../utils/catchAsync";

const router = Router();

const ActionType = {
    START: "start",
    STOP: "stop",
    ENABLE: "enable",
    DISABLE: "disable",
}

type ActionType = typeof ActionType[keyof typeof ActionType];

router.route("/:type")
    .post(validate({
        params: Joi.object().keys({
            type: Joi.string().valid(...Object.values(ActionType)).required(),
        }),
        body: Joi.object().keys({
            id: Joi.number().required(),
        })
    }), catchAsync(async (req, res) => {
        const data = await Database.server.findUnique({
            where: {
                id: req.body.id
            }
        });
        if(!data) {
            throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
        }
        switch(req.params.type) {
            case ActionType.START: {
                (await actionService.startBackup(data.id)).awaitStarted();
                break;
            }
            case ActionType.STOP: {
                terminalService.stopTerminal(data.id);
                break;
            }
            case ActionType.ENABLE: {
                scheduleService.activate(data.id);
                break;
            }
            case ActionType.DISABLE: {
                scheduleService.disable(data.id);
                break;
            }
            default: {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid action type");
            }
        }
        res.status(httpStatus.OK).send();
    })); 
export default router;
