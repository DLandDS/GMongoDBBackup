import { Router } from "express";
import serverRouter from "./server";
import actionRouter from "./action";
import settingRouter from "./setting";

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
    {
        path: "/setting",
        router: settingRouter,
    }
];

const routers = routes.map((route) => {
    const router = Router();
    router.use(route.path, route.router);
    return router;
});

export default routers;