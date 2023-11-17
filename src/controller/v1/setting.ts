import { Router } from "express";
import { settingService } from "../../service";
import validate from "../../middleware/validate";
import Joi from "joi";
import catchAsync from "../../utils/catchAsync";

const router = Router();

router.route("/")
.get(validate({}), (req, res) => {
    res.send(settingService.getSetting());
})
.patch(validate({
    body: Joi.object().keys({
        command: Joi.string().required(),
        terminalLogSize: Joi.number().required(),
        suffixFormat: Joi.string().required(),
        backupDir: Joi.string().required(),
        driveDirId: Joi.string().required(),
        fileNameFormat: Joi.string().required(),
    }),
}), catchAsync(async (req, res) => {
    const setting = await settingService.updateSetting(req.body);
    res.send(setting);
}));

export default router;