import { pool } from "../db";
import crypto from "crypto";

export async function findUserByEmail(email: string) {
    const user = await pool.query
        ('SELECT * FROM users WHERE email = $1', [email]);
    return user.rows[0];
}

export async function createUser(email:string, password:string) {
    const new_user = await pool.query
        ('INSERT INTO users(email, password) VALUES ($1, $2) RETURNING *', [email, password]);
    return new_user.rows[0];
}

export function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// date.now() renvoie des milliseconds donc faut convertir 24h en ms
export async function saveVerificationToken(userId: number, token: string) {
    await pool.query
        ('UPDATE users SET token = $1, date = $2 WHERE id = $3', [token, new Date(Date.now() + 24 * 60 * 60 * 1000), userId]); 
}

export async function verifyUserToken(token: string) {
    const user = await pool.query
        ('SELECT * FROM users WHERE token = $1 AND date > NOW()', [token]);
    return user.rows[0];
}

export async function confirmUser(userId: number) {
    await pool.query
        ('UPDATE users SET is_confirmed = $1, token = NULL, date = NULL WHERE id = $2', [true, userId]);
}

export async function updateUserPassword(userId: number, password: string) {
    await pool.query
        ('UPDATE users SET password = $1 WHERE id = $2', [password, userId]);
}

export async function findUserByGithubId(id: number) {
    const gh_id = await pool.query
        ('SELECT * FROM users WHERE github_id = $1', [id]);
    return gh_id.rows[0];
}

export async function createUserFromGithub(email: string, id: number) {
    const new_user = await pool.query
        ('INSERT INTO users(email, github_id) values ($1, $2) RETURNING *', [email, id]);
    return new_user.rows[0];
}

export async function linkGithubId(userId: number, githubId: number) {
    await pool.query
        ('UPDATE users SET github_id = $1 WHERE id = $2', [githubId, userId]);  
}

export async function deleteUser(userId: number) {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1",
    [userId]
  );

  return result.rowCount;
}