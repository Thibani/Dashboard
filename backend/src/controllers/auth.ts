import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser, generateVerificationToken, saveVerificationToken, verifyUserToken, confirmUser } from "../models/user";
import type { Request, Response } from "express";
import { sendVerificationEmail } from "../services/email";

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
  if (await findUserByEmail(email) != undefined) {
    return res.status(400).json({ message: "This email already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser(email, hashedPassword);
  const token = generateVerificationToken();
  await saveVerificationToken(user.id, token);
  await sendVerificationEmail(email, token);
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
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
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
  const token = req.query.token as string;
  const user = await verifyUserToken(token);

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification token." });
  }
  await confirmUser(user.id);
  return res.status(200).json({ message: "Account successfully verified."});
}