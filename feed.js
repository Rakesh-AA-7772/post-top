// feed.js
import { db } from './firebase.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const username = localStorage.getItem('username');
if (!username) {
  window.location.href = 'name.html';
}

// Display username in header
const userNameEl = document.getElementById('userName');
if (userNameEl) {
  userNameEl.textContent = username;
}

// User profile click handler
const userProfile = document.getElementById('userProfile');
if (userProfile) {
  userProfile.addEventListener('click', () => {
    const action = confirm(`👤 ${username}\n\n[OK] Change name\n[Cancel] Close`);
    if (action) {
      localStorage.removeItem('username');
      window.location.href = 'name.html';
    }
  });
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
    
    // Auto-hide after 1 seconds
    setTimeout(() => {
      dialog.style.animation = 'fadeOut 0.3s ease-out forwards';
      backdrop.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        dialog.remove();
        backdrop.remove();
      }, 300);
    }, 1000);
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
  const imageUrl = data.imageUrl || '';
  const reactions = data.reactions || {};
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
  card.style.cursor = 'pointer';
  
  let reactionsHtml = '';
  if (Object.keys(reactions).length > 0) {
    reactionsHtml = '<div class="reactions-bar" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px;">';
    Object.entries(reactions).forEach(([emoji, users]) => {
      const count = Object.keys(users).length;
      reactionsHtml += `<span style="background:rgba(255,11,88,0.08);border:1px solid var(--accent);padding:4px 8px;border-radius:999px;font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;" onclick="event.stopPropagation(); toggleReactionFeed('${postId}', '${emoji}');"><span>${emoji}</span><span style="font-weight:600;">${count}</span></span>`;
    });
    reactionsHtml += '</div>';
  }

  card.innerHTML = `
    <div>
      <span class="name-pill">${escapeHtml(name)}</span>
      <span class="time">${escapeHtml(timeText)}</span>
    </div>
    <div class="content"></div>
    ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="Post image" style="width:100%;max-height:300px;border-radius:12px;margin:12px 0;object-fit:cover;">` : ''}
    ${reactionsHtml}
    <div class="card-actions" style="margin-top:${Object.keys(reactions).length > 0 ? '8px' : '12px'};display:flex;gap:8px;align-items:center;">
      <button class="card-action-emoji" style="background:transparent;border:none;padding:6px 8px;font-size:18px;cursor:pointer;border-radius:6px;transition:all 0.2s;" onclick="event.stopPropagation(); toggleEmojiPickerFeed('${postId}');"><img src="reaction.svg" alt="Add reaction" style="width:20px;height:20px;"></button>
      <button class="card-action-btn reply-btn" data-post-id="${escapeHtml(postId)}" onclick="event.stopPropagation();" style="flex:1;display:flex;align-items:center;gap:6px;justify-content:center;">
        💬 <span id="reply-count-${postId}" style="font-weight:600;"></span>
      </button>
    </div>
    <div class="emoji-picker-inline" id="picker-${postId}" style="display:none;margin-top:12px;padding:12px;background:rgba(255,11,88,0.05);border-radius:8px;border:1px solid var(--border);gap:8px;flex-wrap:wrap;justify-content:center;animation:slideIn 0.2s ease-out;">
      <span class="emoji-option" onclick="event.stopPropagation(); addReactionFeed('${postId}', '😂');" style="font-size:24px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.2s;background:transparent;" onmouseover="this.style.background='rgba(255,11,88,0.1);transform:scale(1.15)';" onmouseout="this.style.background='transparent';transform:scale(1)';">😂</span>
      <span class="emoji-option" onclick="event.stopPropagation(); addReactionFeed('${postId}', '💀');" style="font-size:24px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.2s;background:transparent;" onmouseover="this.style.background='rgba(255,11,88,0.1);transform:scale(1.15)';" onmouseout="this.style.background='transparent';transform:scale(1)';">💀</span>
      <span class="emoji-option" onclick="event.stopPropagation(); addReactionFeed('${postId}', '😭');" style="font-size:24px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.2s;background:transparent;" onmouseover="this.style.background='rgba(255,11,88,0.1);transform:scale(1.15)';" onmouseout="this.style.background='transparent';transform:scale(1)';">😭</span>
      <span class="emoji-option" onclick="event.stopPropagation(); addReactionFeed('${postId}', '🔥');" style="font-size:24px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.2s;background:transparent;" onmouseover="this.style.background='rgba(255,11,88,0.1);transform:scale(1.15)';" onmouseout="this.style.background='transparent';transform:scale(1)';">🔥</span>
      <span class="emoji-option" onclick="event.stopPropagation(); addReactionFeed('${postId}', '❤️');" style="font-size:24px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.2s;background:transparent;" onmouseover="this.style.background='rgba(255,11,88,0.1);transform:scale(1.15)';" onmouseout="this.style.background='transparent';transform:scale(1)';">❤️</span>
      <span class="emoji-option" onclick="event.stopPropagation(); addReactionFeed('${postId}', '👍');" style="font-size:24px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.2s;background:transparent;" onmouseover="this.style.background='rgba(255,11,88,0.1);transform:scale(1.15)';" onmouseout="this.style.background='transparent';transform:scale(1)';">👍</span>
    </div>
  `;
  // set content as text to preserve newlines and avoid XSS
  card.querySelector('.content').textContent = content;
  
  // Load reply count
  loadReplyCountFeed(postId, card.querySelector(`#reply-count-${postId}`));
  
  // Make the entire card clickable to view post details
  card.addEventListener('click', () => {
    window.location.href = `post-detail.html?id=${postId}`;
  });
  
  // Add reply button handler
  const replyBtn = card.querySelector('.reply-btn');
  if (replyBtn) {
    replyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `post-detail.html?id=${postId}`;
    });
  }

  return card;
}

// Load reply count for feed
async function loadReplyCountFeed(postId, countElement) {
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

// Toggle emoji picker inline
window.toggleEmojiPickerFeed = function(postId) {
  const picker = document.getElementById(`picker-${postId}`);
  if (picker) {
    picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
  }
};

// Add reaction from feed
window.addReactionFeed = async function(postId, emoji) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    const reactions = postDoc.data()?.reactions || {};

    if (!reactions[emoji]) reactions[emoji] = {};

    if (reactions[emoji][username]) {
      delete reactions[emoji][username];
      if (Object.keys(reactions[emoji]).length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji][username] = true;
    }

    await updateDoc(postRef, { reactions });
    
    // Hide picker
    const picker = document.getElementById(`picker-${postId}`);
    if (picker) picker.style.display = 'none';
  } catch (err) {
    console.error('Error adding reaction:', err);
  }
};


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
