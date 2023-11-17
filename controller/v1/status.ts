import { Request, Router } from "express";
import validate from "../../middleware/validate";
import Joi from "joi";
import { scheduleService, terminalService } from "../../service";
import Database from "../../database";
import catchAsync from "../../utils/catchAsync";

const router = Router();

const StatusType = {
	Running: "running",
	Ready: "ready",
	Error: "error",
	Inactive: "inactive",
} as const;

type StatusType = typeof StatusType[keyof typeof StatusType];

router.post(
	"/",
	validate({
		body: Joi.object({
			id: Joi.array().items(Joi.number()).required(),
		}),
	}),
	catchAsync(async (req: Request<any, any, { id: number[] }>, res) => {
		const statuses: {
			[x: string]: {
				lastBackup: Date,
				status: {
					type: StatusType,
					message: string,
				},
				enabled: boolean,
			}
		} = {};
		for (const id of req.body.id) {
			const server = await Database.server.findUnique({
				where: {
					id
				}
			});
			statuses[id] = {} as any;
			const terminal = terminalService.getTerminal(id);
			const activated = scheduleService.isActive(id);
			statuses[id].enabled = server?.enabled || false;
			if (terminal?.isAlive()) {
				statuses[id].status = {
					type: "running",
					message: "Running"
				};
			} else if (terminal?.error) {
				statuses[id].status = {
					type: "error",
					message: (terminal.error?.message || "Error Unexpected") + (activated? "": " (Inactive)")
				};
			} else {
				if(activated){
					statuses[id].status = {
						type: "ready",
						message: "Ready"
					};
				} else {
					statuses[id].status = {
						type: "inactive",
						message: "Inactive"
					};
				}
			}

			const record = await Database.server.findUnique({
				where: {
					id
				}
			})
			if (record) {
				statuses[id].lastBackup = record.lastBackup;
			}
		}
		res.send(statuses);
	})
);

export default router;
