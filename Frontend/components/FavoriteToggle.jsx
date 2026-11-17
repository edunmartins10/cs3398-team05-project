import { useState } from 'react';
import { Star } from 'lucide-react';
import './FavoriteToggle.css';

export default function FavoriteToggle({ isFavorite, onToggle }) {
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      await onToggle();
    } finally {
      setSaving(false);
    }
  }

  const label = isFavorite ? 'Remove from favorites' : 'Save as favorite';
  return (
    <button
      type="button"
      className="favorite-toggle-button"
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      onClick={toggle}
      disabled={saving}
    >
      <Star aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  );
}
