import React from 'react';
import { formatRelativeTime, getExpiryStatus } from '../utils/helpers';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * Color-coded expiry badge for note cards.
 */
export default function ExpiryBadge({ expiresAt }) {
  if (!expiresAt) return null;

  const status = getExpiryStatus(expiresAt);
  const text = formatRelativeTime(expiresAt);

  if (status === 'none') return null;

  const Icon = status === 'critical' || status === 'expired' ? AlertTriangle : Clock;

  return (
    <span className={`expiry-badge expiry-badge--${status}`}>
      <Icon size={11} />
      {text}
    </span>
  );
}
