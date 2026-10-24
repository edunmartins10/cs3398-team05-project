import { useEffect, useRef, useState } from 'react';

export default function OrderDialog({ item, onConfirm, onClose }) {
  const ref = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (item && !ref.current?.open) ref.current?.showModal();
    if (!item && ref.current?.open) ref.current.close();
    if (item) setError('');
  }, [item]);

  async function confirm() {
    setSaving(true);
    setError('');
    try {
      await onConfirm(item);
    } catch (err) {
      setError(err.message || 'Your order history could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={ref} className="order-dialog absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" onClose={onClose} onCancel={onClose}>
      {item && (
        <>
          <div className="dialoghead">
            <div>
              <div className="eyebrow">ORDER HISTORY</div>
              <h2>Add this to your order history?</h2>
            </div>
            <button type="button" className="close" onClick={onClose} aria-label="Close">×</button>
          </div>
          <p><strong>{item.name}</strong> from {item.restaurant}</p>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary" type="button" onClick={confirm} disabled={saving}>
            {saving ? 'Saving…' : 'Yes, add to my order history'}
          </button>
          <button className="text-button" type="button" onClick={onClose} disabled={saving}>Not now</button>
        </>
      )}
    </dialog>
  );
}