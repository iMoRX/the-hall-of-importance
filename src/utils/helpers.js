/**
 * Format a date to relative time string (e.g., "2 days left", "Expired 3h ago")
 */
export function formatRelativeTime(date) {
  if (!date) return null;

  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 0) {
    const absMins = Math.abs(diffMins);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);
    if (absMins < 60) return `Expired ${absMins}m ago`;
    if (absHours < 24) return `Expired ${absHours}h ago`;
    return `Expired ${absDays}d ago`;
  }

  if (diffMins < 60) return `${diffMins}m left`;
  if (diffHours < 24) return `${diffHours}h left`;
  if (diffDays === 1) return '1 day left';
  if (diffDays < 30) return `${diffDays} days left`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} months left`;
  return `${Math.round(diffDays / 365)} years left`;
}

/**
 * Get expiry status: 'expired', 'critical' (<1 day), 'warning' (<3 days), 'safe', 'none'
 */
export function getExpiryStatus(expiresAt) {
  if (!expiresAt) return 'none';

  const now = new Date();
  const target = new Date(expiresAt);
  const diffMs = target - now;
  const diffDays = diffMs / 86400000;

  if (diffMs < 0) return 'expired';
  if (diffDays < 1) return 'critical';
  if (diffDays < 3) return 'warning';
  return 'safe';
}

/**
 * Calculate expiry date from a number of days from now
 */
export function getExpiryDate(days) {
  if (days === null || days === undefined) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date to input[type=datetime-local] value
 */
export function formatDateForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Parse tags from a comma-separated string
 */
export function parseTags(tagString) {
  if (!tagString) return [];
  return tagString
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i); // unique
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Get file type category for display
 */
export function getFileTypeCategory(mimeType) {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  return 'file';
}

/**
 * Strip HTML tags for preview text
 */
export function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Debounce function
 */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
