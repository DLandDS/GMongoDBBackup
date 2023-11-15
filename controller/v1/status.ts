import { Request, Router } from "express";
import validate from "../../middleware/validate";
import Joi from "joi";
import { terminalService } from "../../service";
import Database from "../../database";
import catchAsync from "../../utils/catchAsync";

const router = Router();

router.post(
	"/status",
	validate({
		body: Joi.object({
			id: Joi.array().items(Joi.number()).required(),
		}),
	}),
	catchAsync(async (req: Request<any, any, { id: number[] }>, res) => {
		const statuses: { [x: string]: { lastBackup: Date, status: string} } = {}; 
		for (const id of req.body.id) {
			statuses[id] = {} as any;
			const terminal = terminalService.getTerminal(id);
			if(!terminal) {
				statuses[id].status = "Ready";
			} else {
				const exitCode = terminal.getProcess().exitCode;
				if(exitCode === null){
					statuses[id].status = "Running";
				} else if(exitCode === 0) {
					statuses[id].status = "Ready";
				} else {
					statuses[id].status = "Error exit code " + exitCode;
				}
			}
			const record = await Database.server.findUnique({
				where: {
					id
				}
			})
			if(record) {
				statuses[id].lastBackup = record.lastBackup;
			} 
		}
		res.send(statuses);
	})
);

export default router;
