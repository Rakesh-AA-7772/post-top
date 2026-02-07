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
  // If user hasn't set a name, send them to name page
  window.location.href = 'name.html';
}

document.getElementById('postBtn').addEventListener('click', () => {
  window.location.href = 'post.html';
});

// Elements
const feedEl = document.getElementById('feed');
const emptyEl = document.getElementById('empty');

function renderPost(doc) {
  const data = doc.data ? doc.data() : doc; // supporting both snapshot and plain object if needed
  const name = data.name || 'Unknown';
  const content = data.content || '';
  const ts = data.timestamp;

  // safe time formatting
  let timeText = '';
  try {
    if (ts && ts.toDate) {
      const d = ts.toDate();
      timeText = formatDate(d);
    } else if (ts && ts.seconds) {
      timeText = formatDate(new Date(ts.seconds * 1000));
    } else {
      timeText = '';
    }
  } catch (e) {
    timeText = '';
  }

  const card = document.createElement('div');
  card.className = 'card';

  const head = document.createElement('div');
  head.innerHTML = `<span class="name">${escapeHtml(name)}</span><span class="time">${escapeHtml(timeText)}</span>`;

  const body = document.createElement('div');
  body.className = 'content';
  body.textContent = content;

  card.appendChild(head);
  card.appendChild(body);

  return card;
}

function formatDate(d){
  // e.g. "6 Feb, 6:12 PM"
  try{
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit'
    }).format(d);
  } catch(e){
    return d.toLocaleString();
  }
}

function escapeHtml(s){
  return String(s);
}

// realtime listener: latest posts on top
const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(200));
onSnapshot(q, (snapshot) => {
  feedEl.innerHTML = '';
  if (snapshot.empty) {
    emptyEl.style.display = 'block';
    return;
  } else {
    emptyEl.style.display = 'none';
  }
  snapshot.forEach(doc => {
    const card = renderPost(doc);
    feedEl.appendChild(card);
  });
}, (err) => {
  console.error('Feed error:', err);
  feedEl.innerHTML = '<div class="empty">Failed to load posts.</div>';
});

