import { Request, Router } from "express";
import validate from "../../middleware/validate";
import Joi from "joi";
import catchAsync from "../../utils/catchAsync";
import { MongoClient } from "mongodb";
import drive from "../../gdrive";

const router = Router();

router.route("/db-connection-test")
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

router.route("/grdiveDir-check")
.post(validate({
    body: Joi.object({
        id: Joi.string().required(),
    }),
}), catchAsync(async (req: Request<any, any, { id: string }>, res) => {
    try {
        await drive.files.list({
            q: `'${req.body.id}' in parents and trashed = false`,
        })
        res.send({
            success: true,
            message: "Detected successfully",
        });
    } catch (err: any) {
        res.send({
            success: false,
            message: "Detected failed",
        });
    }
}));

export default router;