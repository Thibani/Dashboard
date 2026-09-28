import type { Response } from "express";
import type { AuthedRequest } from "../middleware/auth";
import { getDashboardInstances, saveDashboardInstances } from "../models/dashboard";

export async function getDashboard(req: AuthedRequest, res: Response) {
    const instances = await getDashboardInstances(req.userId as number);
    return res.status(200).json({ instances });
}

export async function putDashboard(req: AuthedRequest, res: Response) {
    const { instances } = req.body;

    const isValid =
        Array.isArray(instances) &&
        instances.every((i) =>
            i && typeof i.id === "string" && typeof i.service === "string" && typeof i.widget === "string"
        );
    if (!isValid) {
        return res.status(400).json({ message: "instances must be an array of widget instances" });
    }

    await saveDashboardInstances(req.userId as number, instances);
    return res.status(200).json({ instances });
}