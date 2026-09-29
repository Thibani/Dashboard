import { pool } from "../db";

export async function getDashboardInstances(userId: number) {
    const result = await pool.query
        ('SELECT instances FROM dashboards WHERE user_id = $1', [userId]);
    return result.rows[0]?.instances ?? [];
}

// JSON.stringify est nécessaire : pg convertirait un tableau JS en tableau Postgres, pas en JSON
export async function saveDashboardInstances(userId: number, instances: unknown[]) {
    await pool.query(
        `INSERT INTO dashboards (user_id, instances, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET instances = EXCLUDED.instances, updated_at = NOW()`,
        [userId, JSON.stringify(instances)]
    );
}