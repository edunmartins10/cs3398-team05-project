import { api, postJson } from './api.js';

function normalizedItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    name: String(item.name || item.item_name || '').trim(),
    price: Number(item.price ?? Math.round(Number(item.price_at_time || 0) * 100)),
    calories: Math.round(Number(item.calories || 0)),
    protein: Number(item.protein ?? item.protein_g ?? 0),
  }));
}

export function findSavedOrder(orders, candidate) {
  const restaurant = String(candidate.restaurant || candidate.restaurant_name || '').trim();
  const items = JSON.stringify(normalizedItems(candidate.items ?? candidate.order_items));
  return orders.find((order) => (
    String(order.restaurant_name || '').trim() === restaurant
    && JSON.stringify(normalizedItems(order.items)) === items
  ));
}

export async function toggleSavedOrder(order) {
  const { savedOrders = [] } = await api('/api/auth/saved-orders');
  const existing = findSavedOrder(savedOrders, order);
  if (existing) {
    await api(`/api/auth/saved-orders/${encodeURIComponent(existing.id)}`, { method: 'DELETE' });
    return {
      isSaved: false,
      savedOrders: savedOrders.filter(({ id }) => id !== existing.id),
    };
  }

  const result = await postJson('/api/auth/saved-orders', order);
  return {
    isSaved: true,
    savedOrders: [result.savedOrder, ...savedOrders.filter(({ id }) => id !== result.savedOrder.id)],
  };
}
