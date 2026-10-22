import { useEffect, useRef } from 'react';

export default function OrderDialog({ item, onConfirm, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (item && !ref.current?.open) ref.current?.showModal();
    if (!item && ref.current?.open) ref.current.close();
  }, [item]);

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
          <button className="primary" type="button" onClick={() => onConfirm(item)}>
            Yes, add to my order history
          </button>
          <button className="text-button" type="button" onClick={onClose}>Not now</button>
        </>
      )}
    </dialog>
  );
}