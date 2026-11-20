import { useState } from 'react';

function formatPrice(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function SavedOrders({ orders, loading, error, onReorder, onDelete }) {
  const [action, setAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');

  async function runAction(order, type, callback) {
    setAction({ id: order.id, type });
    setFeedback('');
    setActionError('');
    try {
      await callback(order);
      if (type === 'reorder') setFeedback(`"${order.order_name}" was added to Order History.`);
    } catch (requestError) {
      setActionError(requestError.message || 'That action could not be completed. Please try again.');
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="h-full w-full space-y-4">
      <h2 className="border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Saved Orders</h2>
      {loading ? (
        <p className="py-4 text-center text-[#63726c]" role="status">Loading your saved orders…</p>
      ) : error ? (
        <p className="py-4 text-center text-[#8a2f23]" role="alert">{error}</p>
      ) : orders.length === 0 ? (
        <p className="py-4 text-center text-[#63726c]" role="status">You haven’t saved any favorite orders yet.</p>
      ) : (
        <>
          {feedback && <p className="text-sm text-[#28573a]" role="status">{feedback}</p>}
          {actionError && <p className="text-sm text-[#8a2f23]" role="alert">{actionError}</p>}
          <ul className="space-y-3">
            {orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
              const busy = action?.id === order.id;
              return (
                <li key={order.id} className="rounded-lg border border-[#dfe5df] bg-[#f6f8f5] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[#172b25]">{order.order_name}</h3>
                      <p className="text-sm text-[#63726c]">{order.restaurant_name}</p>
                    </div>
                    <strong className="text-[#176447]">{formatPrice(total)}</strong>
                  </div>
                  <p className="mt-2 text-sm text-[#63726c]">
                    {items.map((item, index) => (
                      <span key={`${item.name}-${index}`}>
                        {index > 0 ? ' · ' : ''}{item.name} ({item.calories ?? '—'} cal, {item.protein ?? '—'}g protein)
                      </span>
                    ))}
                    {' · '}{new Date(order.created_at).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-[#176447] px-3 py-2 text-sm font-semibold text-white hover:bg-[#125239] disabled:opacity-60"
                      onClick={() => runAction(order, 'reorder', onReorder)}
                      disabled={Boolean(action)}
                    >
                      {busy && action.type === 'reorder' ? 'Adding…' : 'Reorder'}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-[#dfe5df] px-3 py-2 text-sm font-semibold text-[#63726c] hover:bg-white disabled:opacity-60"
                      onClick={() => runAction(order, 'delete', onDelete)}
                      disabled={Boolean(action)}
                    >
                      {busy && action.type === 'delete' ? 'Deleting…' : 'Delete'}
                    </button>
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
