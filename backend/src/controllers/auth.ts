import bcrypt from "bcrypt";
import { findUserByEmail, createUser } from "../models/user";
import type { Request, Response } from "express";

export async function register(req: Request, res: Response) {
    const { email, password } = req.body;
    if (await findUserByEmail(email) != undefined) {
        return res.status(400).json("This email already exists");
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(email, hashedPassword);
        return res.status(201).json({ message: "Account created successfully" });
    }
}