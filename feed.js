// feed.js
import { db } from './firebase.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const username = localStorage.getItem('username');
if (!username) {
  window.location.href = 'name.html';
}

// show online dot (pure frontend indicator)
const statusDot = document.getElementById('statusDot');
if (statusDot) statusDot.style.display = 'inline-block';

// Post button behavior
const postBtn = document.getElementById('postBtn');
if (postBtn) postBtn.addEventListener('click', () => { window.location.href = 'post.html'; });

// Elements
const feedEl = document.getElementById('feed');
const emptyEl = document.getElementById('empty');
const leaderboardEl = document.getElementById('leaderboard');
const toastEl = document.getElementById('toast');

// helper to escape basic HTML (name/time)
function escapeHtml(s){
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// format timestamp
function formatDate(d){
  try{
    return new Intl.DateTimeFormat(undefined, {
      day:'numeric', month:'short',
      hour:'numeric', minute:'2-digit'
    }).format(d);
  } catch(e){
    return d.toLocaleString();
  }
}

// render one post card
function renderPost(doc){
  const data = doc.data();
  const name = data.name || 'Unknown';
  const content = data.content || '';
  const ts = data.timestamp;

  let timeText = '';
  try {
    if (ts && ts.toDate) timeText = formatDate(ts.toDate());
    else if (ts && ts.seconds) timeText = formatDate(new Date(ts.seconds * 1000));
  } catch (e) {
    timeText = '';
  }

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div>
      <span class="name-pill">${escapeHtml(name)}</span>
      <span class="time">${escapeHtml(timeText)}</span>
    </div>
    <div class="content"></div>
  `;
  // set content as text to preserve newlines and avoid XSS
  card.querySelector('.content').textContent = content;
  return card;
}

// Firestore query: latest first
const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(500));

onSnapshot(q, snap => {
  // reset UI
  feedEl.innerHTML = '';
  leaderboardEl.innerHTML = '';

  if (snap.empty) {
    emptyEl.style.display = 'block';
    return;
  } else {
    emptyEl.style.display = 'none';
  }

  // build count map
  const countMap = Object.create(null);

  snap.forEach(doc => {
    const data = doc.data();
    // render feed (newest first)
    const card = renderPost(doc);
    feedEl.appendChild(card);

    // accumulate counts
    if (data.name) {
      const n = String(data.name).trim();
      if (n.length) countMap[n] = (countMap[n] || 0) + 1;
    }
  });

  // build leaderboard: sort descending and take top 5
  const top = Object.entries(countMap)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);

  if (top.length === 0) {
    leaderboardEl.innerHTML = `<div style="color:var(--muted);font-size:13px">No posts yet.</div>`;
  } else {
    top.forEach(([name, count], idx) => {
      const row = document.createElement('div');
      row.className = 'leader';
      row.innerHTML = `<span>${escapeHtml(name)}</span><span class="count">${count}</span>`;
      leaderboardEl.appendChild(row);
    });
  }
}, err => {
  console.error('Feed error:', err);
  feedEl.innerHTML = '<div class="empty">Failed to load posts.</div>';
});
