import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Intro from './components/Intro.jsx';
import Filters from './components/Filters.jsx';
import Results from './components/Results.jsx';
import ImportDialog from './components/ImportDialog.jsx';
import AuthDialog from './components/AuthDialog.jsx';
import AccountDialog from './components/AccountDialog.jsx';
import DonationDialog from './components/DonationDialog.jsx';
import { parseMenu, restaurantNames } from './lib/value.js';
import { api, postJson, putJson } from './lib/api.js';
import { distanceMiles, radiusLimit } from './lib/location.js';

const DEFAULTS = { budget: '10', goal: 'balanced', minimum: '400', combos: true };

export default function App() {
  const [menu, setMenu] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [budget, setBudget] = useState(DEFAULTS.budget);
  const [goal, setGoal] = useState(DEFAULTS.goal);
  const [minimum, setMinimum] = useState(DEFAULTS.minimum);
  const [combos, setCombos] = useState(DEFAULTS.combos);
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const [catalogInfo, setCatalogInfo] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [ranked, setRanked] = useState({ orders: [], totalCount: 0 });
  const [rankingStatus, setRankingStatus] = useState('idle');
  const [rankingError, setRankingError] = useState('');
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
    const distance = profile && itemLocation
      ? distanceMiles({ latitude: profile.latitude, longitude: profile.longitude }, itemLocation)
      : null;
    return [name, distance];
  })), [names, menu, profile]);
  const hasMenuLocations = menu.some((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  const hasUnlocatedRestaurants = menu.some((item) => !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude));
  const visibleMenu = useMemo(() => {
    const limit = radiusLimit(profile);
    if (!profile || !profile.limitRecommendations || !profile.latitude || !profile.longitude || !hasMenuLocations) return menu;
    return menu.filter((item) => {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return true;
      const distance = distanceByRestaurant[item.restaurant];
      return distance !== null && distance <= limit;
    });
  }, [menu, profile, distanceByRestaurant, hasMenuLocations]);

  useEffect(() => {
    api('/api/auth/me').then((data) => setProfile(data.profile || null)).catch(() => setProfile(null));
    const params = new URLSearchParams(window.location.search);
    const token = params.get('verify');
    const donation = params.get('donation');
    if (donation === 'success') { setNotice('Thanks for supporting Bitewise!'); setNoticeError(false); }
    if (donation === 'cancelled') { setNotice('Your donation was cancelled. No payment was made.'); setNoticeError(false); }
    if (token) {
      postJson('/api/auth/verify', { token })
        .then(() => {
          setNotice('Email confirmed. You can now log in.');
          setNoticeError(false);
          setAuthOpen(true);
        })
        .catch((error) => {
          setNotice(error.message);
          setNoticeError(true);
        })
        .finally(() => {
          params.delete('verify');
          const query = params.toString();
          window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
        });
    }
    if (donation) {
      params.delete('donation');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api('/api/restaurants')
      .then((data) => {
        if (cancelled) return;
        setMenu((previous) => data.items.concat(previous.filter((item) => item.source === 'custom')));
        setSelected((previous) => new Set([...restaurantNames(data.items), ...previous]));
        setCatalogInfo(data);
        setCatalogStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalogError(error.message);
        setCatalogStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (catalogStatus !== 'ready') return undefined;
    const controller = new AbortController();
    const visibleNames = new Set(visibleMenu.map((item) => item.restaurant));
    setRankingStatus('loading');
    setRankingError('');
    api('/api/rank', {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({
        budgetCents: Math.max(0, Math.round((Number(budget) || 0) * 100)),
        minimumCalories: Number(minimum) || 0,
        combos,
        goal,
        selectedRestaurants: [...selected].filter((name) => visibleNames.has(name)),
        customItems: visibleMenu.filter((item) => item.source === 'custom'),
      }),
    })
      .then((data) => {
        setRanked(data);
        setRankingStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setRankingError(error.message);
        setRankingStatus('error');
      });
    return () => controller.abort();
  }, [catalogStatus, visibleMenu, selected, budget, minimum, combos, goal]);

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
      const custom = parseMenu(menuText, name, 0).map((item, index) => ({
        ...item,
        id: `custom-${Date.now()}-${index}`,
        ...location,
      }));
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

  async function saveProfile(changes) {
    const data = await putJson('/api/profile', changes);
    setProfile(data.profile);
    setNotice(changes.textUpdates && !data.smsDeliveryConfigured
      ? 'Your settings are saved. The site owner still needs to connect an SMS provider before text updates can be delivered.'
      : 'Your account and recommendation settings are saved.');
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
    try { await postJson('/api/auth/logout', {}); } catch { /* Clear the local view even if the network is interrupted. */ }
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
        {!profile && <div className="account-prompt"><strong>Make Bitewise yours.</strong><span>Create an account to save your ZIP code, manage travel distance, and opt in to text updates.</span><button type="button" onClick={() => setAuthOpen(true)}>Create account</button></div>}
        {notice && <div className={`notice ${noticeError ? 'notice-error' : ''}`} role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        <div className="demo">
          <strong>{catalogStatus === 'loading' ? 'Loading restaurant data' : 'Restaurant database'}</strong>
          <span>
            {catalogStatus === 'error'
              ? `Restaurant menu data could not be loaded: ${catalogError}`
              : catalogStatus === 'loading'
                ? 'Fetching restaurant menus and nutrition from the connected database API.'
                : `${catalogInfo.restaurantCount} restaurants loaded from the database API. Rankings are calculated by Price_value.cpp.${catalogInfo.skippedItemCount ? ` ${catalogInfo.skippedItemCount} items without usable price and nutrition data were excluded.` : ''}`}
          </span>
        </div>
        {profile?.limitRecommendations && !profile.latitude && <div className="notice notice-error">We couldn’t look up that ZIP code, so distance filtering is paused. Update your ZIP in Account settings.</div>}
        {profile?.limitRecommendations && profile.latitude && hasUnlocatedRestaurants && <div className="notice">Some restaurant records do not include coordinates, so the distance limit cannot be applied to those restaurants.</div>}
        <div className="workspace">
          <Filters
            budget={budget} onBudgetChange={setBudget} goal={goal} onGoalChange={setGoal}
            minimum={minimum} onMinimumChange={setMinimum} restaurants={names} itemCounts={itemCounts}
            selected={selected} onToggleRestaurant={toggleRestaurant} combos={combos}
            onCombosChange={setCombos} onReset={resetFilters}
          />
          <Results
            list={ranked.orders}
            totalCount={ranked.totalCount}
            loading={catalogStatus === 'loading' || rankingStatus === 'loading'}
            error={catalogStatus === 'error' ? catalogError : rankingStatus === 'error' ? rankingError : ''}
            goal={goal}
            budgetDollars={budget}
            distances={distanceByRestaurant}
            profile={profile}
            distanceFilteringAvailable={hasMenuLocations}
          />
        </div>
        <footer>
          <span className="brand footerbrand">bitewise.</span>
          <span>A little math. A better lunch.</span>
          <button type="button" className="text-button" onClick={() => setDonationOpen(true)}>Support Bitewise</button>
          <a href="https://unsplash.com/photos/burger-with-lettuce-and-fries-PxJ9zkM2wdA" target="_blank" rel="noreferrer">Photo: Unsplash ↗</a>
        </footer>
      </main>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onSubmit={importMenu} error={importError} />
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={signedIn} initialMessage={notice} />
      {profile && <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} profile={profile} onSave={saveProfile} onSignOut={signOut} />}
      <DonationDialog open={donationOpen} onClose={() => setDonationOpen(false)} onError={(message) => { setNotice(message); setNoticeError(true); }} />
    </>
  );
}
