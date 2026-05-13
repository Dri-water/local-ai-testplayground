import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'postgres',
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/:table', async (req, res) => {
  try {
    const { table } = req.params
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/:table', async (req, res) => {
  try {
    const { table } = req.params
    const values = req.body
    const columns = Object.keys(values).join(', ')
    const placeholders = Object.keys(values).map((_, i) => `$${i + 1}`).join(', ')
    const result = await pool.query(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      Object.values(values)
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params
    const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params
    const values = req.body
    const sets = Object.keys(values).map((k, i) => `${k} = $${i + 1}`).join(', ')
    const vals = [...Object.values(values), id]
    const result = await pool.query(
      `UPDATE ${table} SET ${sets} WHERE id = $${vals.length} RETURNING *`,
      vals
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ deleted: result.rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`) })