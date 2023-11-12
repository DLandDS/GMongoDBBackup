import { Router } from "express";
import validate from "../../middleware/validate";
import Joi from "joi";
import Database from "../../database";
import httpStatus from "http-status";
import ApiError from "../../utils/apiError";
import { terminalService } from "../../service";

const router = Router();

const ActionType = {
    START: "start",
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
    }), async (req, res) => {
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
                const terminal = terminalService.createTerminal(data.id + "", "ping", ["8.8.8.8"]);
                terminal.getLog().addListener((data) => {
                    console.log(data);
                });
            }
            res.status(httpStatus.OK).send();
        }
    });



    
export default router;
