import { Request, Router } from "express";
import validate from "../../middleware/validate";
import Joi from "joi";
import catchAsync from "../../utils/catchAsync";
import { MongoClient } from "mongodb";

const router = Router();

router.route("/connection-test")
.post(validate({
    body: Joi.object({
        uri: Joi.string().required(),
    }),
}), catchAsync(async (req: Request<any, any, { uri: string }>, res) => {
    const client = new MongoClient(req.body.uri, {
        serverSelectionTimeoutMS: 3000,
    });
    try {
        await client.connect();
        res.send({
            success: true,
            message: "Connected successfully",
        });
    } catch (err: any) {
        res.send({
            success: false,
            message: "Connected failed",
        });
    }
}));

export default router;