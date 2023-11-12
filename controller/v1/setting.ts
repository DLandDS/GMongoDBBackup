import { Router } from "express";
import { settingService } from "../../service";
import validate from "../../middleware/validate";
import Joi from "joi";

const router = Router();

router.route("/")
.get(validate({}), (req, res) => {
    res.send(settingService.getSetting());
})
.patch(validate({
    body: Joi.object().keys({
        command: Joi.string().required(),
        terminalLogSize: Joi.number().required(),
    }),
}), async (req, res) => {
    const setting = await settingService.updateSetting(req.body);
    res.send(setting);
})

export default router;