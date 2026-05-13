import './style.css'

const API = '/api'
const app = document.getElementById('app')

// State
let view = 'threads' // 'threads' | 'thread'
let currentThreadId = null
let threads = []
let posts = []

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
        <button class="btn new-thread" onclick="startNewThread()">+ New Thread</button>
        <div id="thread-list"></div>
      </div>`
    renderThreadList()
  } else {
    app.innerHTML = `
      <div class="container">
        <header>
          <button class="btn back" onclick="goBack()">← Back</button>
          <h1 class="logo">/mb/ - Message Board</h1>
        </header>
        <div id="thread-view"></div>
      </div>`
    renderThreadView()
  }
}

async function renderThreadList() {
  try {
    threads = await api('/threads')
  } catch { threads = [] }
  const list = document.getElementById('thread-list')
  if (threads.length === 0) {
    list.innerHTML = '<p class="empty">No threads yet. Start one!</p>'
    return
  }
  list.innerHTML = threads.map(t => `
    <div class="thread-card" onclick="openThread('${t.id}')">
      <div class="thread-title">${esc(t.title)}</div>
      <div class="thread-meta">
        <span class="author">${esc(t.author)}</span>
        <span class="date">${formatDate(t.created_at)}</span>
      </div>
      <div class="thread-body">${esc(t.body).substring(0, 200)}${t.body.length > 200 ? '...' : ''}</div>
      <div class="thread-replies" onclick="event.stopPropagation()">
        <span onclick="openThread('${t.id}')">View Thread →</span>
      </div>
    </div>
  `).join('')
}

async function renderThreadView() {
  try {
    const thread = await api(`/threads/${currentThreadId}`)
    posts = await api(`/posts?thread_id=${currentThreadId}`)
    const list = document.getElementById('thread-view')

    list.innerHTML = `
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
      <form class="reply-form" onsubmit="addReply(event)">
        <input type="text" name="author" placeholder="Name (optional)" maxlength="100" />
        <textarea name="body" placeholder="Reply..." required maxlength="5000"></textarea>
        <button type="submit" class="btn">Post</button>
      </form>
    `
  } catch (err) {
    document.getElementById('thread-view').innerHTML = `<p class="error">Thread not found</p>`
  }
}

// ── Actions ──
window.startNewThread = () => {
  const title = prompt('Thread title:')
  if (!title) return
  const body = prompt('Thread body:')
  if (!body) return
  const author = prompt('Your name (or leave blank for Anonymous):', '') || 'Anonymous'
  api('/threads', { method: 'POST', body: { title, body, author } })
    .then(() => render())
    .catch(e => alert('Failed to create thread: ' + e))
}

window.openThread = (id) => {
  currentThreadId = id
  view = 'thread'
  render()
}

window.goBack = () => {
  view = 'threads'
  currentThreadId = null
  render()
}

window.addReply = async (e) => {
  e.preventDefault()
  const form = e.target
  const author = (form.author.value || 'Anonymous').trim()
  const body = form.body.value.trim()
  if (!body) return
  try {
    await api('/posts', { method: 'POST', body: { thread_id: currentThreadId, body, author } })
    form.reset()
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