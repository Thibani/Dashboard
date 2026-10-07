import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { findUserByGithubId, findUserByEmail, createUserFromGithub, linkGithubId } from "../models/user";
import { getGithubAccessToken, getGithubUserInfo } from "../services/oauth/github";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set — add it to your .env before starting the server");
}

export function githubRedirect(req: Request, res: Response) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`);
}

async function resolveGithubUser(githubId: number, email: string) {
    const byGithubId = await findUserByGithubId(githubId);
    if (byGithubId) {
        return byGithubId;
    }
    
    const byEmail = await findUserByEmail(email);
    if (byEmail) {
        await linkGithubId(byEmail.id, githubId);
        return byEmail;
    }
    return createUserFromGithub(email, githubId);
}

export async function githubCallBack(req: Request, res: Response) {
    const code = req.query.code as string;

    if (!code) {
        return res.status(400).json({ message: "Missing github code" })
    }

    const accessToken = await getGithubAccessToken(code);
    const githubUser = await getGithubUserInfo(accessToken);

    const user = await resolveGithubUser(githubUser.id, githubUser.email);

    const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        JWT_SECRET as string,
        { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({ token, user: { email: user.email } });
}
