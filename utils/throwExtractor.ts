export default async function throwExtractor(callback: () => Promise<void>) {
	let error: any | undefined;
	try {
		await callback();
	} catch (e) {
		error = e;
	}
	return error;
}
