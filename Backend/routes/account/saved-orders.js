import { Router } from 'express';
import { authenticatedSupabaseSession, userDatabase } from '../../services/supabase.js';

const router = Router();

function validSavedOrder(body) {
  const { name, restaurant, items } = body || {};
  return (
    typeof name === 'string' && name.trim().length > 0 && name.length <= 200 &&
    typeof restaurant === 'string' && restaurant.trim().length > 0 && restaurant.length <= 150 &&
    Array.isArray(items) && items.length >= 1 && items.length <= 2 &&
    items.every((item) => (
      item && typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 150 &&
      Number.isInteger(item.price) && item.price > 0 && item.price <= 200_000 &&
      Number.isFinite(item.calories) && item.calories >= 0 && item.calories <= 20_000 &&
      Number.isFinite(item.protein) && item.protein >= 0 && item.protein <= 2_000
    ))
  );
}

router.get('/', async (req, res) => {
  const session = await authenticatedSupabaseSession(req, res, 'saved orders');
  if (!session) return;

  try {
    const { data, error } = await userDatabase(session.accessToken)
      .from('saved_orders')
      .select('id, order_name, restaurant_name, items, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Could not retrieve saved orders from Supabase:', error);
      return res.status(502).json({ error: 'Could not retrieve your saved orders. Check the saved-orders setup.' });
    }
    return res.json({ savedOrders: data });
  } catch (requestError) {
    console.error('Could not retrieve saved orders from Supabase:', requestError);
    return res.status(502).json({ error: 'Could not retrieve your saved orders. Check the saved-orders setup.' });
  }
});

router.post('/', async (req, res) => {
  const session = await authenticatedSupabaseSession(req, res, 'saved orders');
  if (!session) return;
  if (!validSavedOrder(req.body)) {
    return res.status(400).json({ error: 'That favorite order is not valid. Please try again.' });
  }

  const { name, restaurant, items } = req.body;
  const savedItems = items.map((item) => ({
    name: item.name.trim(),
    price: item.price,
    calories: Math.round(item.calories),
    protein: item.protein,
  }));
  try {
    const database = userDatabase(session.accessToken);
    const { data: existing, error: lookupError } = await database
      .from('saved_orders')
      .select('id, order_name, restaurant_name, items, created_at')
      .eq('user_id', session.user.id)
      .eq('restaurant_name', restaurant.trim())
      .eq('items', JSON.stringify(savedItems))
      .maybeSingle();
    if (lookupError) {
      console.error('Could not check for an existing favorite order in Supabase:', lookupError);
      return res.status(502).json({ error: 'Your favorite order could not be updated. Check the saved-orders setup.' });
    }

    if (existing) {
      return res.json({ savedOrder: existing, isSaved: true });
    }

    const { data, error } = await database
      .from('saved_orders')
      .insert({
        user_id: session.user.id,
        order_name: name.trim(),
        restaurant_name: restaurant.trim(),
        items: savedItems,
      })
      .select('id, order_name, restaurant_name, items, created_at')
      .single();
    if (error) {
      if (error.code === '23505') {
        const { data: duplicate, error: duplicateError } = await database
          .from('saved_orders')
          .select('id, order_name, restaurant_name, items, created_at')
          .eq('user_id', session.user.id)
          .eq('restaurant_name', restaurant.trim())
          .eq('items', JSON.stringify(savedItems))
          .maybeSingle();
        if (!duplicateError && duplicate) return res.json({ savedOrder: duplicate, isSaved: true });
        if (duplicateError) console.error('Could not retrieve concurrent favorite order from Supabase:', duplicateError);
      }
      console.error('Could not save favorite order to Supabase:', error);
      return res.status(502).json({ error: 'Your favorite order could not be updated. Check the saved-orders setup.' });
    }
    return res.status(201).json({ savedOrder: data, isSaved: true });
  } catch (requestError) {
    console.error('Could not save favorite order to Supabase:', requestError);
    return res.status(502).json({ error: 'Your favorite order could not be saved. Check the saved-orders setup.' });
  }
});

router.delete('/:id', async (req, res) => {
  const session = await authenticatedSupabaseSession(req, res, 'saved orders');
  if (!session) return;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
    return res.status(400).json({ error: 'That saved order could not be found.' });
  }

  try {
    const { data, error } = await userDatabase(session.accessToken)
      .from('saved_orders')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', session.user.id)
      .select('id')
      .maybeSingle();
    if (error) {
      console.error('Could not delete favorite order from Supabase:', error);
      return res.status(502).json({ error: 'Your favorite order could not be deleted. Check the saved-orders setup.' });
    }
    if (!data) return res.status(404).json({ error: 'That saved order could not be found.' });
    return res.status(204).end();
  } catch (requestError) {
    console.error('Could not delete favorite order from Supabase:', requestError);
    return res.status(502).json({ error: 'Your favorite order could not be deleted. Check the saved-orders setup.' });
  }
});

export default router;
