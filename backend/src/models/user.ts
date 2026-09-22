import { pool } from "../db";

export async function findUserByEmail(email: string) {
    const user = await pool.query
        ('SELECT * FROM users WHERE email = $1', [email]);
    return user.rows[0];
}

export async function createUser (email:string, password:string) {
    const new_user = await pool.query
        ('INSERT INTO users(email, password) VALUES ($1, $2) RETURNING *', [email, password]);
    return new_user.rows[0];
}