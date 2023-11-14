import { Router } from "express";
import validate from "../../middleware/validate";
import Joi from "joi";

const router = Router();

router.get("/status", validate({
    query: Joi.object({
        id: Joi.array().items(Joi.string()).required(),
    }),
}), (req, res) => {
    res.send({
        status: "ok",
        name: req.query.name,
    });
});

export default router;