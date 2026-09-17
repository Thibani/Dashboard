// je dois créer une connexion à PostegreSQL avec pg (node-postgre)
// il me faut une fct qui execute les fichiers sql dans migrations/

import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool ({
    connectionString: process.env.DATABASE_URL,
});

export async function runMigrations() {
    const migrationDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrationDir).sort();

    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationDir, file), "utf-8");
        await pool.query(sql);
        console.log(`Migration executed : ${file}`);
    }
}