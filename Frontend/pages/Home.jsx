import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import Intro from '../components/Intro.jsx';
import Filters from '../components/Filters.jsx';
import Results from '../components/Results.jsx';
import ImportDialog from '../components/ImportDialog.jsx';
import OrderDialog from '../components/OrderDialog.jsx';
import RecWidget from '../components/RecWidget.jsx';
import { createSampleMenu, dietaryOptions } from '../data/sampleMenu.js';
import { parseMenu, rankedOrders, restaurantNames } from '../lib/value.js';
import { api, postJson, putJson } from '../lib/api.js';
import { distanceMiles, radiusLimit, restaurantLocations } from '../lib/location.js';
import Footer from '../components/Footer.jsx';
const DEFAULTS = { budget: '10', goal: 'balanced', minimum: '400', combos: true };

export default function HomePage() {
  const [menu, setMenu] = useState(createSampleMenu);
  const [selected, setSelected] = useState(() => new Set(createSampleMenu().map((x) => x.restaurant)));
  const [budget, setBudget] = useState(DEFAULTS.budget);
  const [goal, setGoal] = useState(DEFAULTS.goal);
  const [minimum, setMinimum] = useState(DEFAULTS.minimum);
  const [combos, setCombos] = useState(DEFAULTS.combos);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const [profile, setProfile] = useState(null);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [orderItem, setOrderItem] = useState(null);
  const names = useMemo(() => restaurantNames(menu), [menu]);
  const itemCounts = useMemo(() => {
    const counts = {};
    for (const item of menu) counts[item.restaurant] = (counts[item.restaurant] || 0) + 1;
    return counts;
  }, [menu]);
  const distanceByRestaurant = useMemo(() => Object.fromEntries(names.map((name) => {
    const itemLocation = menu.find((item) => item.restaurant === name && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    const location = itemLocation || restaurantLocations[name];
    const distance = profile && location ? distanceMiles({ latitude: profile.latitude, longitude: profile.longitude }, location) : null;
    return [name, distance];
  })), [names, menu, profile]);
  const visibleMenu = useMemo(() => {
    const limit = radiusLimit(profile);
    if (!profile || !profile.limitRecommendations || !profile.latitude || !profile.longitude) return menu;
    return menu.filter((item) => {
      const distance = distanceByRestaurant[item.restaurant];
      return distance !== null && distance <= limit;
    });
  }, [menu, profile, distanceByRestaurant]);
  const list = useMemo(
    () => rankedOrders(visibleMenu, selected, budget, minimum, combos, goal, selectedAllergens),
    [visibleMenu, selected, budget, minimum, combos, goal, selectedAllergens],
  );

  useEffect(() => {
    api('/api/auth/me')
      .then((data) => {
        const nextProfile = data.profile || null;
        setProfile(nextProfile);
        setSelectedAllergens(nextProfile?.allergens ?? []);
      })
      .catch(() => {
        setProfile(null);
        setSelectedAllergens([]);
      });
    const params = new URLSearchParams(window.location.search);
    const donation = params.get('donation');
    if (donation === 'success') { setNotice('Thanks for supporting Bitewise!'); setNoticeError(false); }
    if (donation === 'cancelled') { setNotice('Your donation was cancelled. No payment was made.'); setNoticeError(false); }
    if (donation) {
      params.delete('donation');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    }
  }, []);

  function toggleRestaurant(name, checked) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  }

  function resetFilters() {
    setBudget(DEFAULTS.budget);
    setGoal(DEFAULTS.goal);
    setMinimum(DEFAULTS.minimum);
    setCombos(DEFAULTS.combos);
    setSelectedAllergens([]);
    setSelected(new Set(menu.map((x) => x.restaurant)));
  }

  async function importMenu(restaurantName, menuText, restaurantZip) {
    try {
      const name = restaurantName.trim();
      if (!name) throw Error('Enter a restaurant name.');
      let location = {};
      if (restaurantZip.trim()) {
        const geo = await api(`/api/geo/${encodeURIComponent(restaurantZip.trim())}`);
        location = { latitude: geo.latitude, longitude: geo.longitude, locationLabel: geo.label };
      }
      const start = menu.length ? Math.max(...menu.map((x) => x.id)) + 1 : 0;
      const custom = parseMenu(menuText, name, start).map((item) => ({ ...item, ...location }));
      const nextMenu = menu.filter((x) => x.restaurant !== name).concat(custom);
      setMenu(nextMenu);
      setSelected(new Set([name]));
      setMinimum('0');
      setImportError('');
      setImportOpen(false);
    } catch (err) {
      setImportError(err.message);
    }
  }

  async function confirmOrder(item) {
    if (!profile) {
      setOrderItem(null);
      setNotice('Log in to save orders to your order history.');
      setNoticeError(false);
      return;
    }

    await postJson('/api/auth/orders', {
      restaurant: item.restaurant,
      items: item.items,
    });
    setOrderItem(null);
    setNotice(`Added "${item.name}" to your order history.`);
    setNoticeError(false);
  }

    return (
    <>
      <Header />

      <main>
        <Intro />

        {!profile && 
          <div className="account-prompt">
            <strong>Make Bitewise yours.</strong>
            <span>Create an account to save your ZIP code, manage travel distance, and opt in to text updates.</span>
            <button type="button" onClick={() => { window.location.assign('/account'); }}>
              Create account
            </button>
          </div>
        }

        {notice && 
          <div className={`notice ${noticeError ? 'notice-error' : ''}`} role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button>
          </div>
        }
        
        <div className="workspace">
          <Filters
            budget={budget}
            onBudgetChange={setBudget}
            goal={goal}
            onGoalChange={setGoal}
            minimum={minimum}
            onMinimumChange={setMinimum}
            restaurants={names}
            itemCounts={itemCounts}
            selected={selected}
            onToggleRestaurant={toggleRestaurant}
            combos={combos}
            onCombosChange={setCombos}
            onReset={resetFilters}
            allergens={dietaryOptions}
            selectedAllergens={selectedAllergens}
            onAllergenChange={(allergens) => {
              setSelectedAllergens(allergens);
              if (profile) {
                setProfile((prev) => ({ ...(prev ?? {}), allergens }));
              }
            }}
          />
          <Results list={list} goal={goal} budgetDollars={budget} distances={distanceByRestaurant} profile={profile} onOrder={setOrderItem} />
        </div>

        <Footer />
      </main>

      <ImportDialog 
        open={importOpen} 
        onClose={() => setImportOpen(false)} 
        onSubmit={importMenu} 
        error={importError} 
      />
      <OrderDialog 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        item={orderItem} 
        onConfirm={confirmOrder} 
        onClose={() => setOrderItem(null)} 
      />
      
      <RecWidget order={list[0]} goal={goal} />
    </>
    )
}
