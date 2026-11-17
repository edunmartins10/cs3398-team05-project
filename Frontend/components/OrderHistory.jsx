import { useState } from 'react';
import FavoriteToggle from './FavoriteToggle.jsx';
import { findSavedOrder } from '../lib/savedOrders.js';
import './OrderHistory.css';

export default function OrderHistory({ profile, orders, savedOrders, loading, error, onToggleFavorite }) {
  const [feedback, setFeedback] = useState('');
  const [saveError, setSaveError] = useState('');
  const message = loading
    ? 'Loading your order history…'
    : error || (!profile
      ? 'Log in from the home page to view your order history.'
      : orders.length === 0
        ? 'You don’t have any recent orders yet.'
        : '');

  return (
    <div className="h-full w-full space-y-4">
      <h2 className="text-lg font-semibold text-[#172b25] py-4 border-b border-[#dfe5df]">Order History</h2>
      {message ? (
        <p
          className={`py-4 text-center ${error ? 'text-[#8a2f23]' : 'text-[#63726c]'}`}
          role={error ? 'alert' : 'status'}
        >
          {message}
        </p>
      ) : (
        <>
          {feedback && <p className="text-sm text-[#28573a]" role="status">{feedback}</p>}
          {saveError && <p className="text-sm text-[#8a2f23]" role="alert">{saveError}</p>}
          <ul className="space-y-3">
            {orders.map((order) => {
              const items = Array.isArray(order.order_items) ? order.order_items : [];
              const total = items.reduce((sum, item) => sum + Number(item.price_at_time || 0) * Number(item.quantity || 0), 0);
              const isFavorite = Boolean(findSavedOrder(savedOrders, {
                restaurant: order.restaurant_name,
                items,
              }));
              return (
                <li key={order.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-4 rounded-lg border border-[#dfe5df] bg-[#f6f8f5] p-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#172b25]">{items.map((item) => item.item_name).join(', ')}</h3>
                    <p className="text-sm text-[#63726c]">{order.restaurant_name}</p>
                    <p className="mt-2 text-sm text-[#63726c]">
                      {items.map((item) => `${item.calories ?? '—'} calories · ${item.protein_g ?? '—'}g protein`).join(' · ')}
                      {' · '}{new Date(order.ordered_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="order-history-price-actions">
                    <strong className="text-[#176447]">${total.toFixed(2)}</strong>
                    <FavoriteToggle
                      isFavorite={isFavorite}
                      onToggle={async () => {
                        setFeedback('');
                        setSaveError('');
                        try {
                          const result = await onToggleFavorite(order);
                          setFeedback(result.isSaved ? 'Order saved to your favorites.' : 'Order removed from your favorites.');
                        } catch (requestError) {
                          setSaveError(requestError.message || 'This order could not be updated. Please try again.');
                        }
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
