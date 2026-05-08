// share-utils.js - Share post as image functionality

/**
 * Generate a shareable image from post data
 */
export async function generateShareImage(postData) {
  const { name, content, timestamp } = postData;
  
  // Create a temporary container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 1080px;
    background: linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%);
    padding: 60px;
    border-radius: 20px;
    font-family: 'Inter', system-ui, sans-serif;
    color: #e8eaed;
    z-index: -9999;
  `;

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d.seconds ? d.seconds * 1000 : d);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  container.innerHTML = `
    <div style="
      background: linear-gradient(135deg, rgba(255,11,88,0.1) 0%, rgba(255,11,88,0.05) 100%);
      border: 2px solid rgba(255,11,88,0.3);
      border-radius: 16px;
      padding: 48px;
      min-height: 600px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    ">
      <div>
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
          border-bottom: 2px solid rgba(255,11,88,0.2);
          padding-bottom: 20px;
        ">
          <div style="
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff0b58, #ff6b9d);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 24px;
          ">${name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight: 700; font-size: 18px; color: #ffffff;">${escapeHtml(name)}</div>
            <div style="font-size: 14px; color: #b0b5c0;">${formatDate(timestamp)}</div>
          </div>
        </div>

        <div style="
          font-size: 32px;
          line-height: 1.8;
          color: #ffffff;
          margin-bottom: 40px;
          word-break: break-word;
          white-space: pre-wrap;
          font-weight: 500;
        ">${escapeHtml(content)}</div>
      </div>

      <div style="
        border-top: 2px solid rgba(255,11,88,0.2);
        padding-top: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="
          background: rgba(255,11,88,0.15);
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          color: #ff0b58;
          font-weight: 600;
          letter-spacing: 1px;
        ">✨ WE WRITE</div>
        <div style="
          font-size: 14px;
          color: #6b7280;
          letter-spacing: 0.5px;
        ">Shared via We Write</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Import html2canvas dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    
    return new Promise((resolve, reject) => {
      script.onload = async () => {
        try {
          const canvas = await window.html2canvas(container, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            allowTaint: true
          });
          
          document.body.removeChild(container);
          resolve(canvas);
        } catch (err) {
          document.body.removeChild(container);
          reject(err);
        }
      };
      script.onerror = () => {
        document.body.removeChild(container);
        reject(new Error('Failed to load html2canvas'));
      };
      document.head.appendChild(script);
    });
  } catch (err) {
    document.body.removeChild(container);
    throw err;
  }
}

/**
 * Share image via native sharing or download
 */
export async function shareImage(canvas, postAuthor) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  
  // Check if Web Share API is available
  if (navigator.share && navigator.canShare({ files: [new File([blob], 'post.png', { type: 'image/png' })] })) {
    try {
      await navigator.share({
        files: [new File([blob], `${postAuthor}-post.png`, { type: 'image/png' })],
        title: 'Check out this post from We Write!',
        text: 'I found this awesome post on We Write'
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        downloadImage(blob, postAuthor);
      }
    }
  } else {
    // Fallback: Download the image
    downloadImage(blob, postAuthor);
  }
}

/**
 * Download image as PNG
 */
export function downloadImage(blob, filename = 'post') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-post.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to escape HTML
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
