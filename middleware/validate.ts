import Joi, { AnySchema } from "joi";
import ApiError from "../utils/apiError";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
const validate = (schema: {
	body?: AnySchema;
	query?: AnySchema;
	params?: AnySchema;
}) =>
	catchAsync((req: any, res: any, next: any) => {
		const { body, query, params } = req;
		{
			const bodySchema = schema.body || Joi.object().keys({});
			const { value, error } = bodySchema.validate(body);
			if (error) {
				return next(
					new ApiError(httpStatus.BAD_REQUEST, error.message)
				);
			}
			req.body = value;
		}
		{
			const querySchema = schema.query || Joi.object().keys({});
			const { value, error } = querySchema.validate(query);
			if (error) {
				return next(
					new ApiError(httpStatus.BAD_REQUEST, error.message)
				);
			}
			req.query = value;
		}
		{
			const paramsSchema = schema.params || Joi.object().keys({});
			const { value, error } = paramsSchema.validate(params);
			if (error) {
				return next(
					new ApiError(httpStatus.BAD_REQUEST, error.message)
				);
			}
			req.params = value;
		}
		next();
	});

export default validate;
