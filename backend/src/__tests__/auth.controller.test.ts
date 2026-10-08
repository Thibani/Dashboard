import { register, login, verifyAccount } from "../controllers/auth";
import * as userModel from "../models/user";
import * as emailService from "../services/email";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

jest.mock("../models/user");
jest.mock("../services/email");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(body: Record<string, unknown> = {}, query: Record<string, unknown> = {}) {
  return { body, query } as unknown as Request;
}

describe("register", () => {
  it("rejects a missing email or password", async () => {
    const res = mockRes();
    await register(mockReq({ email: "" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects an email that already belongs to a confirmed account", async () => {
    (userModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: 1, is_confirmed: true });

    const res = mockRes();
    await register(mockReq({ email: "a@a.com", password: "password123" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "This email already exists" });
    expect(userModel.createUser).not.toHaveBeenCalled();
  });

  it("creates a new account, saves a token and sends the confirmation email", async () => {
    (userModel.findUserByEmail as jest.Mock).mockResolvedValue(undefined);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-pw");
    (userModel.createUser as jest.Mock).mockResolvedValue({ id: 42 });
    (userModel.generateVerificationToken as jest.Mock).mockReturnValue("tok-123");

    const res = mockRes();
    await register(mockReq({ email: "new@a.com", password: "password123" }), res);

    expect(userModel.createUser).toHaveBeenCalledWith("new@a.com", "hashed-pw");
    expect(userModel.saveVerificationToken).toHaveBeenCalledWith(42, "tok-123");
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith("new@a.com", "tok-123");
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("reuses an unconfirmed account: updates its password instead of blocking the email", async () => {
    (userModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: 7, is_confirmed: false });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-again");
    (userModel.generateVerificationToken as jest.Mock).mockReturnValue("tok-456");

    const res = mockRes();
    await register(mockReq({ email: "old@a.com", password: "newpassword" }), res);

    expect(userModel.updateUserPassword).toHaveBeenCalledWith(7, "hashed-again");
    expect(userModel.createUser).not.toHaveBeenCalled();
    expect(userModel.saveVerificationToken).toHaveBeenCalledWith(7, "tok-456");
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("login", () => {
  it("rejects an unknown email", async () => {
    (userModel.findUserByEmail as jest.Mock).mockResolvedValue(undefined);

    const res = mockRes();
    await login(mockReq({ email: "x@a.com", password: "pw" }), res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects a wrong password", async () => {
    (userModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: 1, password: "hashed" });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = mockRes();
    await login(mockReq({ email: "x@a.com", password: "wrong" }), res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects an unconfirmed account even with the right password", async () => {
    (userModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: 1, password: "hashed", is_confirmed: false });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = mockRes();
    await login(mockReq({ email: "x@a.com", password: "pw" }), res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns a signed token for valid, confirmed credentials", async () => {
    (userModel.findUserByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      email: "x@a.com",
      password: "hashed",
      is_confirmed: true,
      role: "user",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("signed.jwt.token");

    const res = mockRes();
    await login(mockReq({ email: "x@a.com", password: "pw" }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: "signed.jwt.token", user: { email: "x@a.com" } });
  });
});

describe("verifyAccount", () => {
  it("rejects an invalid or expired token", async () => {
    (userModel.verifyUserToken as jest.Mock).mockResolvedValue(undefined);

    const res = mockRes();
    await verifyAccount(mockReq({}, { token: "bad" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userModel.confirmUser).not.toHaveBeenCalled();
  });

  it("rejects a token that is not a 64-character hex string, without querying the database", async () => {
    const res = mockRes();
    await verifyAccount(mockReq({}, { token: { $ne: "" } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userModel.verifyUserToken).not.toHaveBeenCalled();
  });

  it("confirms the account for a valid token", async () => {
    (userModel.verifyUserToken as jest.Mock).mockResolvedValue({ id: 9 });

    const res = mockRes();
    await verifyAccount(mockReq({}, { token: "a".repeat(64) }), res);

    expect(userModel.confirmUser).toHaveBeenCalledWith(9);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});