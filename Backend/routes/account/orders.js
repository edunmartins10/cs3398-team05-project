import { Router } from 'express';
import { authenticatedSupabaseSession, userDatabase } from '../../services/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const session = await authenticatedSupabaseSession(req, res);
  if (!session) return;

  try {
    const { data, error } = await userDatabase(session.accessToken)
      .from('orders')
      .select('id, restaurant_name, ordered_at, order_items(id, item_name, quantity, price_at_time, calories, protein_g)')
      .order('ordered_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('Could not retrieve order history from Supabase:', error);
      return res.status(502).json({ error: 'Could not retrieve your order history. Check the Supabase order-history setup.' });
    }
    return res.json({ orders: data });
  } catch (requestError) {
    console.error('Could not retrieve order history from Supabase:', requestError);
    return res.status(502).json({ error: 'Could not retrieve your order history. Check the Supabase order-history setup.' });
  }
});

router.post('/', async (req, res) => {
  const session = await authenticatedSupabaseSession(req, res);
  if (!session) return;

  const { restaurant, items } = req.body || {};
  if (
    typeof restaurant !== 'string' || !restaurant.trim() || restaurant.length > 150 ||
    !Array.isArray(items) || items.length < 1 || items.length > 2 ||
    items.some((item) => (
      !item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 150 ||
      !Number.isInteger(item.price) || item.price <= 0 || item.price > 200_000 ||
      !Number.isFinite(item.calories) || item.calories < 0 || item.calories > 20_000 ||
      !Number.isFinite(item.protein) || item.protein < 0 || item.protein > 2_000
    ))
  ) {
    return res.status(400).json({ error: 'That order could not be saved. Please choose a valid order and try again.' });
  }

  try {
    const { data, error } = await userDatabase(session.accessToken)
      .rpc('create_order_with_item', {
        p_restaurant_name: restaurant.trim(),
        p_items: items.map((item) => ({
          name: item.name.trim(),
          price: item.price / 100,
          calories: Math.round(item.calories),
          protein: item.protein,
        })),
      });
    if (error) {
      console.error('Could not save order history to Supabase:', error);
      return res.status(502).json({ error: 'Your order history could not be saved. Check the Supabase order-history setup.' });
    }
    return res.status(201).json({ orderId: data });
  } catch (requestError) {
    console.error('Could not save order history to Supabase:', requestError);
    return res.status(502).json({ error: 'Your order history could not be saved. Check the Supabase order-history setup.' });
  }
});

export default router;
