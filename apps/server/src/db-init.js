import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'postgres',
})

async function init() {
  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
    console.log('Connected to PostgreSQL')
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database init failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    pool.end()
  }
}

init()