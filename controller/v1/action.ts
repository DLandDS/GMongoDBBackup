import { Router } from "express";
import validate from "../../middleware/validate";
import Joi from "joi";
import Database from "../../database";
import httpStatus from "http-status";
import ApiError from "../../utils/apiError";

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
    }),(req, res) => {
        const data = Database.server.findUnique({
            where: {
                id: req.body.id
            }
        });
        if(!data) {
            throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
        }
    });



    
export default router;
