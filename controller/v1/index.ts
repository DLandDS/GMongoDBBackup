import { Router } from "express";
import serverRouter from "./server";
import actionRouter from "./action";

export type IRoute = {
    path: string;
    router: Router;
};

const routes: IRoute[] = [
    {
        path: "/server",
        router: serverRouter,
    },
    {
        path: "/action",
        router: actionRouter,
    },
];

const routers = routes.map((route) => {
    const router = Router();
    router.use(route.path, route.router);
    return router;
});

export default routers;