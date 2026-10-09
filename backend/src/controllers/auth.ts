import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser, updateUserPassword, generateVerificationToken, saveVerificationToken, verifyUserToken, confirmUser, deleteUser } from "../models/user";
import type { Request, Response } from "express";
import { sendVerificationEmail } from "../services/email";
import type { AuthedRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set — add it to your .env before starting the server");
}

export async function register(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    const existing = await findUserByEmail(email);
    if (existing && existing.is_confirmed) {
        return res.status(400).json({ message: "This email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Unconfirmed account (e.g. the link expired): reuse it with the new password
    // and send a fresh confirmation email instead of blocking the email address.
    let userId: number;
    if (existing) {
        await updateUserPassword(existing.id, hashedPassword);
        userId = existing.id;
    } else {
        userId = (await createUser(email, hashedPassword)).id;
    }
    const token = generateVerificationToken();
    await saveVerificationToken(userId, token);
    try {
        await sendVerificationEmail(email, token);
    } catch (err) {
        // Without this, the rejection is unhandled and Node kills the whole server.
        console.error("Could not send the verification email:", err);
        return res.status(502).json({ message: "Could not send the confirmation email. Please try again later." });
    }
    return res.status(201).json({ message: "Account created successfully" });
}

export async function login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    // Accounts created through GitHub/Google have no password.
    if (!user.password) {
        return res.status(401).json({ message: "This account uses GitHub or Google sign-in" });
    }
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.is_confirmed) {
        return res.status(403).json({ message: "Please confirm your email before logging in" });
    }
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET as string, {
        expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(200).json({
        token,
        user: { email: user.email },
    });
}

export async function verifyAccount(req: Request, res: Response) {
    const token = req.query.token;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({ message: "Invalid or expired verification token." });
    }
    const user = await verifyUserToken(token);

    if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token." });
    }
    await confirmUser(user.id);
    return res.status(200).json({ message: "Account successfully verified." });
}

export async function deleteAccount(req: AuthedRequest, res: Response) {
    if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const deleted = await deleteUser(req.userId);
    if (deleted === 0) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.status(204).send();
}
