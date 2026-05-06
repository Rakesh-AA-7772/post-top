// feed.js
import { db } from './firebase.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const username = localStorage.getItem('username');
if (!username) {
  window.location.href = 'name.html';
}

// Easter egg: Track logo clicks
let logoClicks = 0;
const logo = document.getElementById('logo');
if (logo) {
  logo.addEventListener('click', () => {
    logoClicks++;
    const message = `🎉 EASTER EGG: YOU CLICKED ME ${logoClicks} TIME${logoClicks !== 1 ? 'S' : ''}`;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--card);
      border: 2px solid var(--accent);
      border-radius: 16px;
      padding: 32px 28px;
      text-align: center;
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
    `;
    
    dialog.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <div style="font-size: 18px; font-weight: 600; color: var(--accent); margin-bottom: 8px;">EASTER EGG!</div>
      <div style="font-size: 16px; color: var(--text); margin-bottom: 20px;">You clicked me <strong>${logoClicks}</strong> time${logoClicks !== 1 ? 's' : ''}!</div>
      <div style="font-size: 13px; color: var(--muted);">Keep clicking... something might happen 😉</div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      dialog.style.animation = 'fadeOut 0.3s ease-out forwards';
      backdrop.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        dialog.remove();
        backdrop.remove();
      }, 300);
    }, 3000);
  });
}

// Add animations for dialog
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -60%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// Post button behavior
const postBtn = document.getElementById('postBtn');
if (postBtn) postBtn.addEventListener('click', () => { window.location.href = 'post.html'; });

// Elements
const feedEl = document.getElementById('feed');
const emptyEl = document.getElementById('empty');
const leaderboardEl = document.getElementById('leaderboard');
const toastEl = document.getElementById('toast');
const skeletonLoader = document.getElementById('skeleton-loader');

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
  const postId = doc.id;

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
    <div class="card-actions">
      <button class="card-action-btn reply-btn" data-post-id="${escapeHtml(postId)}">
        ↩️ Reply <span class="reply-count" data-post-id="${escapeHtml(postId)}">0</span>
      </button>
    </div>
  `;
  // set content as text to preserve newlines and avoid XSS
  card.querySelector('.content').textContent = content;
  
  // Load reply count for this post
  loadReplyCount(postId, card.querySelector('.reply-count'));
  
  // Add reply button handler
  const replyBtn = card.querySelector('.reply-btn');
  replyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.setItem('replyingTo', postId);
    localStorage.setItem('replyingToName', name);
    window.location.href = 'reply.html';
  });

  return card;
}

// Load reply count for a post
async function loadReplyCount(postId, countElement) {
  try {
    const repliesQuery = query(
      collection(db, 'replies'),
      where('postId', '==', postId)
    );
    const snapshot = await getDocs(repliesQuery);
    const count = snapshot.size;
    if (count > 0) {
      countElement.textContent = count;
      countElement.style.display = 'inline';
    }
  } catch (err) {
    console.warn('Could not load reply count:', err);
  }
}

// Firestore query: latest first
const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(500));

let isFirstLoad = true;

onSnapshot(q, snap => {
  if (isFirstLoad) {
    isFirstLoad = false;
    skeletonLoader.style.display = 'block';
  }

  // reset UI
  feedEl.innerHTML = '';
  leaderboardEl.innerHTML = '';
  skeletonLoader.style.display = 'none';

  if (snap.empty) {
    emptyEl.style.display = 'block';
    // Update post counter
    const postCountEl = document.getElementById('postCount');
    if (postCountEl) postCountEl.textContent = '0';
    return;
  } else {
    emptyEl.style.display = 'none';
  }

  // Update post counter
  const postCountEl = document.getElementById('postCount');
  if (postCountEl) postCountEl.textContent = snap.size;

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
  skeletonLoader.style.display = 'none';
  feedEl.innerHTML = '<div class="empty">Failed to load posts.</div>';
});
