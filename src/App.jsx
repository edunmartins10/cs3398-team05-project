import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Intro from './components/Intro.jsx';
import Filters from './components/Filters.jsx';
import Results from './components/Results.jsx';
import ImportDialog from './components/ImportDialog.jsx';
import AuthDialog from './components/AuthDialog.jsx';
import AccountDialog from './components/AccountDialog.jsx';
import DonationDialog from './components/DonationDialog.jsx';
import { createSampleMenu, dietaryOptions } from './data/sampleMenu.js';
import { parseMenu, rankedOrders, restaurantNames } from './lib/value.js';
import { api, postJson, putJson } from './lib/api.js';
import { distanceMiles, radiusLimit, restaurantLocations } from './lib/location.js';

const DEFAULTS = { budget: '10', goal: 'balanced', minimum: '400', combos: true };

export default function App() {
  const [menu, setMenu] = useState(createSampleMenu);
  const [selected, setSelected] = useState(() => new Set(createSampleMenu().map((x) => x.restaurant)));
  const [budget, setBudget] = useState(DEFAULTS.budget);
  const [goal, setGoal] = useState(DEFAULTS.goal);
  const [minimum, setMinimum] = useState(DEFAULTS.minimum);
  const [combos, setCombos] = useState(DEFAULTS.combos);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);

  const names = useMemo(() => restaurantNames(menu), [menu]);
  const itemCounts = useMemo(() => {
    const counts = {};
    for (const item of menu) counts[item.restaurant] = (counts[item.restaurant] || 0) + 1;
    return counts;
  }, [menu]);

  const distanceByRestaurant = useMemo(() => Object.fromEntries(names.map((name) => {
    const itemLocation = menu.find((item) => item.restaurant === name && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    const location = itemLocation || restaurantLocations[name];
    const distance = profile && location
      ? distanceMiles({ latitude: profile.latitude, longitude: profile.longitude }, location)
      : null;
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
    api('/api/auth/me').then((data) => setProfile(data.profile || null)).catch(() => setProfile(null));
  }, []);

  function toggleRestaurant(name, checked) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name); else next.delete(name);
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
      setMenu(menu.filter((x) => x.restaurant !== name).concat(custom));
      setSelected(new Set([name]));
      setMinimum('0');
      setImportError('');
      setImportOpen(false);
    } catch (err) {
      setImportError(err.message);
    }
  }

  async function saveProfile(changes) {
    const data = await putJson('/api/profile', changes);
    setProfile(data.profile);
    setNotice('Your account and recommendation settings are saved.');
    setNoticeError(false);
  }

  async function signedIn() {
    const data = await api('/api/auth/me');
    setProfile(data.profile);
    setAuthOpen(false);
    setNotice(`Welcome back, ${data.profile.username}.`);
    setNoticeError(false);
  }

  async function signOut() {
    try { await postJson('/api/auth/logout', {}); } catch {}
    setProfile(null);
    setNotice('You have been logged out.');
    setNoticeError(false);
  }

  return (
    <>
      <Header
        onOpenImport={() => { setImportError(''); setImportOpen(true); }}
        profile={profile}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        onSignOut={signOut}
        onDonate={() => setDonationOpen(true)}
      />
      <main>
        <Intro />
        {notice && <div className={`notice ${noticeError ? 'notice-error' : ''}`} role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        <div className="demo">
          <strong>Expanded San Marcos menu mode</strong>
          <span>Menu names are based on real restaurant offerings. Demo prices, calories, protein, and allergen tags should be verified against current official menus before production use.</span>
        </div>
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
            allergens={dietaryOptions}
            selectedAllergens={selectedAllergens}
            onAllergenChange={setSelectedAllergens}
            combos={combos}
            onCombosChange={setCombos}
            onReset={resetFilters}
          />
          <Results list={list} goal={goal} budgetDollars={budget} distances={distanceByRestaurant} profile={profile} />
        </div>
        <footer>
          <span className="brand footerbrand">bitewise.</span>
          <span>A little math. A better lunch.</span>
          <button type="button" className="text-button" onClick={() => setDonationOpen(true)}>Support Bitewise</button>
        </footer>
      </main>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onSubmit={importMenu} error={importError} />
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={signedIn} initialMessage={notice} />
      {profile && <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} profile={profile} onSave={saveProfile} onSignOut={signOut} />}
      <DonationDialog open={donationOpen} onClose={() => setDonationOpen(false)} onError={(message) => { setNotice(message); setNoticeError(true); }} />
    </>
  );
}
