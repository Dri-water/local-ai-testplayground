import './style.css'

const API = '/api'
const app = document.getElementById('app')

// State
let view = 'threads' // 'threads' | 'thread'
let currentThreadId = null

// ── API helpers ──
async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  return res.json()
}

// ── Render ──
function render() {
  if (view === 'threads') {
    app.innerHTML = `
      <div class="container">
        <header>
          <h1 class="logo">/mb/ - Message Board</h1>
        </header>
        <button id="new-thread-btn" class="btn new-thread">+ New Thread</button>
        <div id="thread-list"></div>
      </div>`
    document.getElementById('new-thread-btn').addEventListener('click', startNewThread)
    renderThreadList()
  } else {
    app.innerHTML = `
      <div class="container">
        <header>
          <button id="back-btn" class="btn back">← Back</button>
          <h1 class="logo">/mb/ - Message Board</h1>
        </header>
        <div id="thread-view"></div>
      </div>`
    document.getElementById('back-btn').addEventListener('click', goBack)
    renderThreadView()
  }
}

async function renderThreadList() {
  try {
    const threads = await api('/threads')
    const list = document.getElementById('thread-list')
    if (threads.length === 0) {
      list.innerHTML = '<p class="empty">No threads yet. Start one!</p>'
      return
    }
    list.innerHTML = ''
    threads.forEach(t => {
      const card = document.createElement('div')
      card.className = 'thread-card'
      card.innerHTML = `
        <div class="thread-title">${esc(t.title)}</div>
        <div class="thread-meta">
          <span class="author">${esc(t.author)}</span>
          <span class="date">${formatDate(t.created_at)}</span>
        </div>
        <div class="thread-body">${esc(t.body).substring(0, 200)}${t.body.length > 200 ? '...' : ''}</div>
      `
      card.addEventListener('click', () => openThread(t.id))
      list.appendChild(card)
    })
  } catch (e) {
    console.error('Failed to load threads', e)
  }
}

async function renderThreadView() {
  const container = document.getElementById('thread-view')
  try {
    const thread = await api(`/threads/${currentThreadId}`)
    const posts = await api(`/posts?thread_id=${currentThreadId}`)

    container.innerHTML = `
      <div class="op-post">
        <div class="post-title">${esc(thread.title)}</div>
        <div class="post-meta">
          <span class="author">${esc(thread.author)}</span>
          <span class="date">${formatDate(thread.created_at)}</span>
        </div>
        <div class="post-body">${esc(thread.body)}</div>
      </div>
      <div class="replies">
        ${posts.map(p => `
          <div class="reply">
            <div class="reply-meta">
              <span class="author">${esc(p.author)}</span>
              <span class="date">${formatDate(p.created_at)}</span>
            </div>
            <div class="reply-body">${esc(p.body)}</div>
          </div>
        `).join('')}
      </div>
      <form id="reply-form" class="reply-form">
        <input type="text" name="author" placeholder="Name (optional)" maxlength="100" />
        <textarea name="body" placeholder="Reply..." required maxlength="5000"></textarea>
        <button type="submit" class="btn">Post</button>
      </form>
    `
    document.getElementById('reply-form').addEventListener('submit', addReply)
  } catch (err) {
    container.innerHTML = `<p class="error">Thread not found</p>`
  }
}

// ── Actions ──
async function startNewThread() {
  const title = prompt('Thread title:')
  if (!title) return
  const body = prompt('Thread body:')
  if (!body) return
  const author = prompt('Your name (or leave blank for Anonymous):', '') || 'Anonymous'
  try {
    await api('/threads', { method: 'POST', body: { title, body, author } })
    render()
  } catch (e) {
    alert('Failed to create thread: ' + e)
  }
}

function openThread(id) {
  currentThreadId = id
  view = 'thread'
  render()
}

function goBack() {
  view = 'threads'
  currentThreadId = null
  render()
}

async function addReply(e) {
  e.preventDefault()
  const form = e.target
  const author = (form.author.value || 'Anonymous').trim()
  const body = form.body.value.trim()
  if (!body) return
  try {
    await api('/posts', { method: 'POST', body: { thread_id: currentThreadId, body, author } })
    render()
  } catch (err) {
    alert('Failed to post reply')
  }
}

// ── Helpers ──
function esc(s) {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

function formatDate(d) {
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Init
render()