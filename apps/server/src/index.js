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

// Threads
app.get('/api/threads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM threads ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/threads', async (req, res) => {
  try {
    const { title, body, author } = req.body
    const result = await pool.query(
      'INSERT INTO threads (title, body, author) VALUES ($1, $2, $3) RETURNING *',
      [title, body, author || 'Anonymous']
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/threads/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM threads WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Posts
app.get('/api/posts', async (req, res) => {
  try {
    const { thread_id } = req.query
    if (thread_id) {
      const result = await pool.query(
        'SELECT * FROM posts WHERE thread_id = $1 ORDER BY created_at ASC',
        [thread_id]
      )
      return res.json(result.rows)
    }
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/posts', async (req, res) => {
  try {
    const { thread_id, body, author } = req.body
    const result = await pool.query(
      'INSERT INTO posts (thread_id, body, author) VALUES ($1, $2, $3) RETURNING *',
      [thread_id, body, author || 'Anonymous']
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`) })