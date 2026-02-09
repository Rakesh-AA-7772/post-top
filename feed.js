// feed.js
import { db } from './firebase.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// get username and redirect if not set
const username = localStorage.getItem('username');
if (!username) {
  window.location.href = 'name.html';
}

// show online dot in header (pure frontend indicator)
const statusDot = document.getElementById('statusDot');
if (statusDot) {
  statusDot.style.display = 'inline-block';
}

// Post button
const postBtn = document.getElementById('postBtn');
if (postBtn) {
  postBtn.addEventListener('click', () => {
    window.location.href = 'post.html';
  });
}

// Elements
const feedEl = document.getElementById('feed');
const emptyEl = document.getElementById('empty');

// helper: simple escape to avoid XSS in name/time
function escapeHtml(s){
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Format timestamp -> "6 Feb, 6:12 PM"
function formatDate(d){
  try{
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit'
    }).format(d);
  } catch(e){
    return d.toLocaleString();
  }
}

// create post card element
function renderPost(doc) {
  const data = doc.data();
  const name = data.name || 'Unknown';
  const content = data.content || '';
  const ts = data.timestamp;

  let timeText = '';
  try {
    if (ts && ts.toDate) {
      timeText = formatDate(ts.toDate());
    } else if (ts && ts.seconds) {
      timeText = formatDate(new Date(ts.seconds * 1000));
    }
  } catch (e) {
    timeText = '';
  }

  const card = document.createElement('div');
  card.className = 'card';

  // header: name pill + time
  const head = document.createElement('div');
  head.innerHTML = `
    <span class="name-pill">${escapeHtml(name)}</span>
    <span class="time">${escapeHtml(timeText)}</span>
  `;

  const body = document.createElement('div');
  body.className = 'content';
  body.textContent = content;

  card.appendChild(head);
  card.appendChild(body);

  return card;
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

  snapshot.forEach((doc) => {
    const card = renderPost(doc);
    feedEl.appendChild(card);
  });
}, (err) => {
  console.error('Feed error:', err);
  feedEl.innerHTML = '<div class="empty">Failed to load posts.</div>';

  Object.entries(countMap)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .forEach(([name,count])=>{
      const row = document.createElement('div');
      row.className='leader';
      row.innerHTML = `
        <span>${name}</span>
        <span class="count">${count}</span>
      `;
      leaderboardEl.appendChild(row);
    });
});

});

