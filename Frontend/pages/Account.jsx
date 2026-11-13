import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { User, Phone, Bell, RotateCcwClock, Save, Settings2, Shield } from 'lucide-react';
import { api, AUTH_CHANGED_EVENT, PROFILE_UPDATED_EVENT, putJson } from '../lib/api.js';
import Footer from '../components/Footer.jsx';
import OrderHistory from '../components/OrderHistory.jsx';

const tabs = [
  { id: 'account', label: 'Account', Icon: User },
  { id: 'order_history', label: 'Order History', Icon: RotateCcwClock },
  { id: 'saved_orders', label: 'Saved Orders', Icon: Save },
  { id: 'preferences', label: 'Preferences', Icon: Settings2 },
  { id: 'address_and_phone', label: 'Address & Phone', Icon: Phone },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'security', label: 'Password & Security', Icon: Shield },
];

function display(value) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  return String(value);
}

function displayDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

function DataRow({ label, value }) {
  return (
    <div className="border-b border-[#dfe5df] py-4 last:border-b-0">
      <dt className="font-bold text-[#172b25]">{label}</dt>
      <dd className="mt-1 text-[#63726c]">{value}</dd>
    </div>
  );
}

export default function AccountPage() {
  const location = useLocation();
  const requestedTab = location.state?.activeTab;
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [editValues, setEditValues] = useState({ username: '', zipCode: '', phone: '' });
  const [accountErrors, setAccountErrors] = useState({});
  const [accountFeedback, setAccountFeedback] = useState(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [addressErrors, setAddressErrors] = useState({});
  const [addressFeedback, setAddressFeedback] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [preferenceValues, setPreferenceValues] = useState({
    budget: '',
    goal: '',
    excludedAllergens: [],
    limitRecommendations: false,
    radiusMiles: '10',
  });
  const [preferenceOptions, setPreferenceOptions] = useState({ goals: [], dietaryRestrictions: [] });
  const [preferenceOptionsError, setPreferenceOptionsError] = useState('');
  const [preferenceErrors, setPreferenceErrors] = useState({});
  const [preferenceFeedback, setPreferenceFeedback] = useState(null);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [activeTab, setActiveTab] = useState(() => (
    tabs.some(({ id }) => id === requestedTab) ? requestedTab : 'account'
  ));

  useEffect(() => {
    if (tabs.some(({ id }) => id === requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => {
    let active = true;
    api('/api/auth/preferences/options')
      .then(({ recommendationGoals, dietaryRestrictions }) => {
        if (!recommendationGoals.length || !dietaryRestrictions.length) {
          throw new Error('Supabase has no enabled recommendation goals or dietary restrictions.');
        }
        if (active) {
          setPreferenceOptions({ goals: recommendationGoals, dietaryRestrictions });
          setPreferenceOptionsError('');
        }
      })
      .catch((error) => {
        if (active) setPreferenceOptionsError(error.message);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    let latestRequest = 0;

    async function loadAccount() {
      const request = ++latestRequest;
      const isCurrentRequest = () => active && request === latestRequest;
      setProfileLoading(true);
      setProfileError('');
      setOrders([]);
      setOrdersLoading(true);
      setOrdersError('');
      try {
        const data = await api('/api/auth/me');
        if (!isCurrentRequest()) return;
        setProfile(data.profile || null);
        if (data.profile) {
          setEditValues({
            username: data.profile.username || '',
            zipCode: data.profile.zipCode || '',
            phone: data.profile.phone || '',
          });
          const preferences = data.profile.recommendationPreferences || {};
          setPreferenceValues({
            budget: preferences.budget == null ? '' : String(preferences.budget),
            goal: preferences.goal || '',
            excludedAllergens: Array.isArray(preferences.excludedAllergens) ? preferences.excludedAllergens : [],
            limitRecommendations: data.profile.limitRecommendations,
            radiusMiles: data.profile.radiusMiles || '10',
          });
        } else {
          setPreferenceValues({
            budget: '',
            goal: '',
            excludedAllergens: [],
            limitRecommendations: false,
            radiusMiles: '10',
          });
        }
        if (!data.profile) {
          setOrdersLoading(false);
          return;
        }

        try {
          const history = await api('/api/auth/orders');
          if (isCurrentRequest()) setOrders(history.orders || []);
        } catch (error) {
          if (isCurrentRequest()) setOrdersError(error.message);
        } finally {
          if (isCurrentRequest()) setOrdersLoading(false);
        }
      } catch (error) {
        if (isCurrentRequest()) setProfileError(error.message);
      } finally {
        if (isCurrentRequest()) setProfileLoading(false);
      }
    }

    loadAccount();
    window.addEventListener(AUTH_CHANGED_EVENT, loadAccount);
    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, loadAccount);
    };
  }, []);

  useEffect(() => {
    if (!preferenceOptions.goals.length) return;
    setPreferenceValues((current) => ({
      ...current,
      goal: preferenceOptions.goals.some(({ goal_key }) => goal_key === current.goal)
        ? current.goal
        : preferenceOptions.goals[0].goal_key,
      excludedAllergens: current.excludedAllergens.filter((key) =>
        preferenceOptions.dietaryRestrictions.some(({ restriction_key }) => restriction_key === key),
      ),
    }));
  }, [preferenceOptions]);

  const providers = [...new Set(profile?.linkedProviders || [])];
  const notifications = profile?.notifications;

  function selectTab(tabId) {
    if (activeTab === 'account' && tabId !== 'account') setAccountFeedback(null);
    if (activeTab === 'address_and_phone' && tabId !== 'address_and_phone') setAddressFeedback(null);
    setActiveTab(tabId);
  }

  async function saveAccount(event, fields, form) {
    event.preventDefault();
    const setSaving = form === 'account' ? setSavingAccount : setSavingAddress;
    const setErrors = form === 'account' ? setAccountErrors : setAddressErrors;
    const setFeedback = form === 'account' ? setAccountFeedback : setAddressFeedback;
    setSaving(true);
    setErrors((current) => ({ ...current, ...Object.fromEntries(fields.map((field) => [field, ''])) }));
    setFeedback(null);
    try {
      const updates = Object.fromEntries(fields.map((field) => [field, editValues[field]]));
      const result = await putJson('/api/auth/me', updates);
      setProfile((current) => ({ ...current, ...result.profile }));
      setEditValues((current) => ({ ...current, ...result.profile }));
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: result.profile }));
      setFeedback({ type: 'success', message: 'Your account information was saved.' });
    } catch (error) {
      if (Array.isArray(error.errors)) {
        setErrors((current) => ({
          ...current,
          ...Object.fromEntries(error.errors.map(({ field, message }) => [field, message])),
        }));
        setFeedback({ type: 'error', message: 'Please correct the highlighted fields and try again.' });
      } else {
        setFeedback({ type: 'error', message: error.message });
      }
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences(event) {
    event.preventDefault();
    setSavingPreferences(true);
    setPreferenceErrors({});
    setPreferenceFeedback(null);
    const rawBudget = preferenceValues.budget.trim();
    const preferences = {
      budget: rawBudget === '' ? null : Number(rawBudget),
      goal: preferenceValues.goal,
      excludedAllergens: preferenceValues.excludedAllergens,
      limitRecommendations: preferenceValues.limitRecommendations,
      radiusMiles: preferenceValues.radiusMiles,
    };
    try {
      const result = await putJson('/api/auth/me/preferences', { preferences });
      setProfile((current) => ({ ...current, recommendationPreferences: result.recommendationPreferences }));
      setPreferenceValues({
        budget: result.recommendationPreferences.budget == null ? '' : String(result.recommendationPreferences.budget),
        goal: result.recommendationPreferences.goal,
        excludedAllergens: result.recommendationPreferences.excludedAllergens,
        limitRecommendations: result.recommendationPreferences.limitRecommendations,
        radiusMiles: result.recommendationPreferences.radiusMiles,
      });
      setProfile((current) => ({
        ...current,
        limitRecommendations: result.recommendationPreferences.limitRecommendations,
        radiusMiles: result.recommendationPreferences.radiusMiles,
      }));
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, {
        detail: { recommendationPreferences: result.recommendationPreferences },
      }));
      setPreferenceFeedback({ type: 'success', message: 'Your preferences were saved.' });
    } catch (error) {
      if (Array.isArray(error.errors)) {
        setPreferenceErrors(Object.fromEntries(error.errors.map(({ field, message }) => [field, message])));
        setPreferenceFeedback({ type: 'error', message: 'Please correct the highlighted fields and try again.' });
      } else {
        setPreferenceFeedback({ type: 'error', message: error.message });
      }
    } finally {
      setSavingPreferences(false);
    }
  }

  return (
    <>
      <Header />

      <main className="account-page mx-auto w-full max-w-[1320px] px-[46px] pt-[34px]">
        <div className="account-page-heading mb-8 border-b border-[#dfe5df] pt-6">
          <h1 className="font-['Space_Grotesk'] text-[36px] font-bold tracking-tight text-[#172b25]">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-[#63726c]">
            View your account information and saved activity.
          </p>
        </div>

        {profileError && (
          <p className="mb-4 rounded-lg border border-[#e7c9c4] bg-[#fff4f1] p-3 text-sm text-[#8a2f23]" role="alert">
            Could not load your account: {profileError}
          </p>
        )}

        <div className="account-settings-layout mb-12">
          <nav aria-label="Account settings" className="account-tabs">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={activeTab === id ? 'page' : undefined}
                className={`account-tab flex w-full items-center space-x-2 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-[#edf3e9] font-bold text-[#176447]'
                    : 'text-[#63726c] hover:bg-[#f6f8f5] hover:text-[#172b25]'
                }`}
                onClick={() => selectTab(id)}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <section className="account-panel">
            {profileLoading ? (
              <p className="py-4 text-center text-[#63726c]" role="status">Loading your account…</p>
            ) : !profile ? (
              <div>
                <h2 className="account-panel-title border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Account</h2>
                <p className="py-4 text-[#63726c]">Create an account to view your account information.</p>
              </div>
            ) : (
              <>
                {activeTab === 'account' && (
                  <div>
                    <h2 className="account-panel-title border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Your Account</h2>
                    <form className="space-y-4 py-4" noValidate onSubmit={(event) => saveAccount(event, ['username'], 'account')}>
                      {accountFeedback && (
                        <p
                          className={`rounded-lg border p-3 text-sm ${accountFeedback.type === 'success' ? 'border-[#cfe0d2] bg-[#f0f7ef] text-[#28573a]' : 'border-[#e7c9c4] bg-[#fff4f1] text-[#8a2f23]'}`}
                          role={accountFeedback.type === 'success' ? 'status' : 'alert'}
                        >
                          {accountFeedback.message}
                        </p>
                      )}
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="accountUsername">Name</label>
                        <input
                          id="accountUsername"
                          autoComplete="username"
                          className="w-full rounded-lg border border-[#dfe5df] px-3 py-2"
                          value={editValues.username}
                          aria-invalid={Boolean(accountErrors.username)}
                          aria-describedby={accountErrors.username ? 'accountUsernameError' : undefined}
                          onChange={(event) => {
                            setEditValues((current) => ({ ...current, username: event.target.value }));
                            setAccountErrors((current) => ({ ...current, username: '' }));
                            setAccountFeedback(null);
                          }}
                        />
                        {accountErrors.username && <p id="accountUsernameError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{accountErrors.username}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="accountEmail">Email</label>
                        <input
                          id="accountEmail"
                          className="w-full rounded-lg border border-[#dfe5df] bg-[#f6f8f5] px-3 py-2 text-[#63726c]"
                          value={profile.email}
                          readOnly
                          aria-describedby="accountEmailHelp"
                        />
                        <p id="accountEmailHelp" className="mt-1 text-sm text-[#63726c]">Email is managed by your sign-in provider.</p>
                      </div>
                      <p className="text-sm text-[#63726c]">
                        <span className="font-bold text-[#172b25]">Linked accounts: </span>
                        {providers.length ? providers.map((provider) => provider[0].toUpperCase() + provider.slice(1)).join(', ') : 'No linked accounts'}
                      </p>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#176447] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#125239] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={savingAccount}
                      >
                        {savingAccount ? 'Saving…' : 'Save changes'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'order_history' && (
                  <OrderHistory profile={profile} orders={orders} loading={ordersLoading} error={ordersError} />
                )}

                {activeTab === 'saved_orders' && (
                  <div>
                    <h2 className="account-panel-title border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Saved Orders</h2>
                    <p className="py-4 text-[#63726c]">
                      Separate saved orders are not currently stored for this account. Your completed orders are available in Order History.
                    </p>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div>
                    <h2 className="account-panel-title border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Preferences</h2>
                    <form className="account-form account-preferences-form space-y-5 py-4" noValidate onSubmit={savePreferences}>
                      {preferenceFeedback && (
                        <p
                          className={`account-form-message rounded-lg border p-3 text-sm ${preferenceFeedback.type === 'success' ? 'border-[#cfe0d2] bg-[#f0f7ef] text-[#28573a]' : 'border-[#e7c9c4] bg-[#fff4f1] text-[#8a2f23]'}`}
                          role={preferenceFeedback.type === 'success' ? 'status' : 'alert'}
                        >
                          {preferenceFeedback.message}
                        </p>
                      )}
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="preferenceBudget">Meal budget (optional)</label>
                        <div className="flex items-center gap-2">
                          <span aria-hidden="true">$</span>
                          <input
                            id="preferenceBudget"
                            type="number"
                            min="1"
                            max="100"
                            step="0.5"
                            className="w-full rounded-lg border border-[#dfe5df] px-3 py-2"
                            value={preferenceValues.budget}
                            aria-invalid={Boolean(preferenceErrors.budget)}
                            aria-describedby={preferenceErrors.budget ? 'preferenceBudgetError' : 'preferenceBudgetHelp'}
                            onChange={(event) => {
                              setPreferenceValues((current) => ({ ...current, budget: event.target.value }));
                              setPreferenceErrors((current) => ({ ...current, budget: '' }));
                              setPreferenceFeedback(null);
                            }}
                          />
                        </div>
                        <p id="preferenceBudgetHelp" className="mt-1 text-sm text-[#63726c]">Enter $1–$100, or leave blank for no saved budget.</p>
                        {preferenceErrors.budget && <p id="preferenceBudgetError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{preferenceErrors.budget}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="preferenceGoal">Recommendation goal</label>
                        <select
                          id="preferenceGoal"
                          className="w-full rounded-lg border border-[#dfe5df] bg-white px-3 py-2"
                          value={preferenceValues.goal}
                          aria-invalid={Boolean(preferenceErrors.goal)}
                          aria-describedby={preferenceErrors.goal ? 'preferenceGoalError' : undefined}
                          onChange={(event) => {
                            setPreferenceValues((current) => ({ ...current, goal: event.target.value }));
                            setPreferenceErrors((current) => ({ ...current, goal: '' }));
                            setPreferenceFeedback(null);
                          }}
                        >
                          {preferenceOptions.goals.map(({ goal_key, label }) => (
                            <option key={goal_key} value={goal_key}>{label}</option>
                          ))}
                        </select>
                        {preferenceErrors.goal && <p id="preferenceGoalError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{preferenceErrors.goal}</p>}
                      </div>
                      <fieldset className="space-y-3">
                        <legend className="font-bold text-[#172b25]">Distance settings</legend>
                        <label className="flex items-center gap-2 text-sm text-[#172b25]">
                          <input
                            type="checkbox"
                            checked={preferenceValues.limitRecommendations}
                            aria-invalid={Boolean(preferenceErrors.limitRecommendations)}
                            onChange={(event) => {
                              setPreferenceValues((current) => ({ ...current, limitRecommendations: event.target.checked }));
                              setPreferenceErrors((current) => ({ ...current, limitRecommendations: '' }));
                              setPreferenceFeedback(null);
                            }}
                          />
                          Limit recommendations by distance
                        </label>
                        {preferenceErrors.limitRecommendations && <p className="text-sm text-[#8a2f23]" role="alert">{preferenceErrors.limitRecommendations}</p>}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-[#172b25]" htmlFor="preferenceRadius">Recommendation radius (miles)</label>
                          <input
                            id="preferenceRadius"
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            disabled={preferenceValues.radiusMiles === 'infinity'}
                            className="w-full rounded-lg border border-[#dfe5df] px-3 py-2 disabled:bg-[#f6f8f5] disabled:text-[#63726c]"
                            value={preferenceValues.radiusMiles === 'infinity' ? '' : preferenceValues.radiusMiles}
                            aria-invalid={Boolean(preferenceErrors.radiusMiles)}
                            aria-describedby={preferenceErrors.radiusMiles ? 'preferenceRadiusError' : 'preferenceRadiusHelp'}
                            onChange={(event) => {
                              setPreferenceValues((current) => ({ ...current, radiusMiles: event.target.value }));
                              setPreferenceErrors((current) => ({ ...current, radiusMiles: '' }));
                              setPreferenceFeedback(null);
                            }}
                          />
                          <p id="preferenceRadiusHelp" className="mt-1 text-sm text-[#63726c]">Enter 1–100 miles or choose any distance.</p>
                          {preferenceErrors.radiusMiles && <p id="preferenceRadiusError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{preferenceErrors.radiusMiles}</p>}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-[#172b25]">
                          <input
                            type="checkbox"
                            checked={preferenceValues.radiusMiles === 'infinity'}
                            onChange={(event) => {
                              setPreferenceValues((current) => ({
                                ...current,
                                radiusMiles: event.target.checked ? 'infinity' : '10',
                              }));
                              setPreferenceErrors((current) => ({ ...current, radiusMiles: '' }));
                              setPreferenceFeedback(null);
                            }}
                          />
                          Any distance
                        </label>
                      </fieldset>
                      <fieldset>
                        <legend className="mb-2 font-bold text-[#172b25]">Dietary restrictions &amp; allergens</legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {preferenceOptions.dietaryRestrictions.map(({ restriction_key, label }) => (
                            <label key={restriction_key} className="flex items-center gap-2 text-sm text-[#172b25]">
                              <input
                                type="checkbox"
                                checked={preferenceValues.excludedAllergens.includes(restriction_key)}
                                onChange={(event) => {
                                  setPreferenceValues((current) => ({
                                    ...current,
                                    excludedAllergens: event.target.checked
                                      ? [...current.excludedAllergens, restriction_key]
                                      : current.excludedAllergens.filter((item) => item !== restriction_key),
                                  }));
                                  setPreferenceErrors((current) => ({ ...current, excludedAllergens: '' }));
                                  setPreferenceFeedback(null);
                                }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                        {preferenceErrors.excludedAllergens && <p className="mt-1 text-sm text-[#8a2f23]" role="alert">{preferenceErrors.excludedAllergens}</p>}
                      </fieldset>
                      {preferenceOptionsError && (
                        <p className="account-form-message rounded-lg border border-[#e7c9c4] bg-[#fff4f1] p-3 text-sm text-[#8a2f23]" role="alert">
                          Could not load preference options: {preferenceOptionsError}
                        </p>
                      )}
                      <p className="text-sm text-[#63726c]">
                        Saved preferences are stored with your account and do not yet change recommendations.
                      </p>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#176447] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#125239] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={savingPreferences || preferenceOptions.goals.length === 0 || preferenceOptionsError !== ''}
                      >
                        {savingPreferences ? 'Saving…' : 'Save preferences'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'address_and_phone' && (
                  <div>
                    <h2 className="account-panel-title border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Address and Phone</h2>
                    <form className="account-form space-y-4 py-4" noValidate onSubmit={(event) => saveAccount(event, ['zipCode', 'phone'], 'address')}>
                      {addressFeedback && (
                        <p
                          className={`rounded-lg border p-3 text-sm ${addressFeedback.type === 'success' ? 'border-[#cfe0d2] bg-[#f0f7ef] text-[#28573a]' : 'border-[#e7c9c4] bg-[#fff4f1] text-[#8a2f23]'}`}
                          role={addressFeedback.type === 'success' ? 'status' : 'alert'}
                        >
                          {addressFeedback.message}
                        </p>
                      )}
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="accountZipCode">Home ZIP code</label>
                        <input
                          id="accountZipCode"
                          autoComplete="postal-code"
                          className="w-full rounded-lg border border-[#dfe5df] px-3 py-2"
                          value={editValues.zipCode}
                          aria-invalid={Boolean(addressErrors.zipCode)}
                          aria-describedby={addressErrors.zipCode ? 'accountZipCodeError' : undefined}
                          onChange={(event) => {
                            setEditValues((current) => ({ ...current, zipCode: event.target.value }));
                            setAddressErrors((current) => ({ ...current, zipCode: '' }));
                            setAddressFeedback(null);
                          }}
                        />
                        {addressErrors.zipCode && <p id="accountZipCodeError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{addressErrors.zipCode}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="accountPhone">Phone number</label>
                        <input
                          id="accountPhone"
                          type="tel"
                          autoComplete="tel"
                          className="w-full rounded-lg border border-[#dfe5df] px-3 py-2"
                          value={editValues.phone}
                          aria-invalid={Boolean(addressErrors.phone)}
                          aria-describedby={addressErrors.phone ? 'accountPhoneError' : undefined}
                          onChange={(event) => {
                            setEditValues((current) => ({ ...current, phone: event.target.value }));
                            setAddressErrors((current) => ({ ...current, phone: '' }));
                            setAddressFeedback(null);
                          }}
                        />
                        {addressErrors.phone && <p id="accountPhoneError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{addressErrors.phone}</p>}
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#176447] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#125239] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={savingAddress}
                      >
                        {savingAddress ? 'Saving…' : 'Save changes'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="account-panel-title border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Notifications</h2>
                    <dl>
                      <DataRow label="Text updates" value={profile.textUpdates ? 'Opted in' : 'Not opted in'} />
                      <DataRow label="Email notifications" value={notifications?.emailNotifications == null ? 'Not configured' : notifications.emailNotifications ? 'On' : 'Off'} />
                      <DataRow label="Price drop alerts" value={notifications?.priceDropAlerts == null ? 'Not configured' : notifications.priceDropAlerts ? 'On' : 'Off'} />
                      <DataRow label="Weekly summary" value={notifications?.weeklySummary == null ? 'Not configured' : notifications.weeklySummary ? 'On' : 'Off'} />
                    </dl>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div>
                    <h2 className="account-panel-title border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Password and Security</h2>
                    <dl>
                      <DataRow label="Email verification" value={profile.emailConfirmedAt ? 'Verified' : 'Not verified'} />
                      <DataRow label="Account created" value={displayDate(profile.createdAt)} />
                      <DataRow label="Last sign in" value={displayDate(profile.lastSignInAt)} />
                    </dl>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <Footer />
      </main>
    </>
  );
}
