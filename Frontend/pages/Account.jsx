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
  const [editErrors, setEditErrors] = useState({});
  const [editFeedback, setEditFeedback] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
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

  const providers = [...new Set(profile?.linkedProviders || [])];
  const recommendationPreferences = profile?.recommendationPreferences;
  const notifications = profile?.notifications;

  async function saveAccount(event, fields) {
    event.preventDefault();
    setSavingProfile(true);
    setEditErrors((current) => Object.fromEntries(fields.map((field) => [field, ''])));
    setEditFeedback(null);
    try {
      const updates = Object.fromEntries(fields.map((field) => [field, editValues[field]]));
      const result = await putJson('/api/auth/me', updates);
      setProfile((current) => ({ ...current, ...result.profile }));
      setEditValues((current) => ({ ...current, ...result.profile }));
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: result.profile }));
      setEditFeedback({ type: 'success', message: 'Your account information was saved.' });
    } catch (error) {
      if (Array.isArray(error.errors)) {
        setEditErrors(Object.fromEntries(error.errors.map(({ field, message }) => [field, message])));
        setEditFeedback({ type: 'error', message: 'Please correct the highlighted fields and try again.' });
      } else {
        setEditFeedback({ type: 'error', message: error.message });
      }
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1320px] px-[46px] pt-[34px]">
        <div className="mb-8 border-b border-[#dfe5df] pt-6">
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

        <div className="mb-12 flex h-full flex-row justify-around gap-9">
          <nav aria-label="Account settings" className="flex h-[480px] flex-row space-x-2 overflow-x-auto overflow-y-visible rounded-[16px] border border-[#dfe5df] bg-white p-4 pb-4 md:flex-col md:space-x-0 md:space-y-1 md:pb-0">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={activeTab === id ? 'page' : undefined}
                className={`flex w-full items-center space-x-2 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-[#edf3e9] font-bold text-[#176447]'
                    : 'text-[#63726c] hover:bg-[#f6f8f5] hover:text-[#172b25]'
                }`}
                onClick={() => setActiveTab(id)}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <section className="h-[480px] flex-1 overflow-y-auto rounded-[16px] border border-[#dfe5df] bg-white p-6">
            {profileLoading ? (
              <p className="py-4 text-center text-[#63726c]" role="status">Loading your account…</p>
            ) : !profile ? (
              <div>
                <h2 className="border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Account</h2>
                <p className="py-4 text-[#63726c]">Create an account to view your account information.</p>
              </div>
            ) : (
              <>
                {activeTab === 'account' && (
                  <div>
                    <h2 className="border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Your Account</h2>
                    <form className="space-y-4 py-4" noValidate onSubmit={(event) => saveAccount(event, ['username'])}>
                      {editFeedback && (
                        <p
                          className={`rounded-lg border p-3 text-sm ${editFeedback.type === 'success' ? 'border-[#cfe0d2] bg-[#f0f7ef] text-[#28573a]' : 'border-[#e7c9c4] bg-[#fff4f1] text-[#8a2f23]'}`}
                          role={editFeedback.type === 'success' ? 'status' : 'alert'}
                        >
                          {editFeedback.message}
                        </p>
                      )}
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="accountUsername">Name</label>
                        <input
                          id="accountUsername"
                          autoComplete="username"
                          className="w-full rounded-lg border border-[#dfe5df] px-3 py-2"
                          value={editValues.username}
                          aria-invalid={Boolean(editErrors.username)}
                          aria-describedby={editErrors.username ? 'accountUsernameError' : undefined}
                          onChange={(event) => {
                            setEditValues((current) => ({ ...current, username: event.target.value }));
                            setEditErrors((current) => ({ ...current, username: '' }));
                            setEditFeedback(null);
                          }}
                        />
                        {editErrors.username && <p id="accountUsernameError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{editErrors.username}</p>}
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
                        disabled={savingProfile}
                      >
                        {savingProfile ? 'Saving…' : 'Save changes'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'order_history' && (
                  <OrderHistory profile={profile} orders={orders} loading={ordersLoading} error={ordersError} />
                )}

                {activeTab === 'saved_orders' && (
                  <div>
                    <h2 className="border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Saved Orders</h2>
                    <p className="py-4 text-[#63726c]">
                      Separate saved orders are not currently stored for this account. Your completed orders are available in Order History.
                    </p>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div>
                    <h2 className="border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Preferences</h2>
                    <dl>
                      <DataRow label="Limit recommendations by distance" value={profile.limitRecommendations ? 'On' : 'Off'} />
                      <DataRow label="Recommendation radius" value={profile.radiusMiles === 'infinity' ? 'Any distance' : `${display(profile.radiusMiles)} miles`} />
                      <DataRow label="Meal budget" value={recommendationPreferences?.budget == null ? 'Not provided' : `$${recommendationPreferences.budget}`} />
                      <DataRow label="Recommendation goal" value={display(recommendationPreferences?.goal)} />
                      <DataRow
                        label="Excluded allergens"
                        value={Array.isArray(recommendationPreferences?.excludedAllergens) && recommendationPreferences.excludedAllergens.length
                          ? recommendationPreferences.excludedAllergens.join(', ')
                          : 'None recorded'}
                      />
                    </dl>
                  </div>
                )}

                {activeTab === 'address_and_phone' && (
                  <div>
                    <h2 className="border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Address and Phone</h2>
                    <form className="space-y-4 py-4" noValidate onSubmit={(event) => saveAccount(event, ['zipCode', 'phone'])}>
                      {editFeedback && (
                        <p
                          className={`rounded-lg border p-3 text-sm ${editFeedback.type === 'success' ? 'border-[#cfe0d2] bg-[#f0f7ef] text-[#28573a]' : 'border-[#e7c9c4] bg-[#fff4f1] text-[#8a2f23]'}`}
                          role={editFeedback.type === 'success' ? 'status' : 'alert'}
                        >
                          {editFeedback.message}
                        </p>
                      )}
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="accountZipCode">Home ZIP code</label>
                        <input
                          id="accountZipCode"
                          autoComplete="postal-code"
                          className="w-full rounded-lg border border-[#dfe5df] px-3 py-2"
                          value={editValues.zipCode}
                          aria-invalid={Boolean(editErrors.zipCode)}
                          aria-describedby={editErrors.zipCode ? 'accountZipCodeError' : undefined}
                          onChange={(event) => {
                            setEditValues((current) => ({ ...current, zipCode: event.target.value }));
                            setEditErrors((current) => ({ ...current, zipCode: '' }));
                            setEditFeedback(null);
                          }}
                        />
                        {editErrors.zipCode && <p id="accountZipCodeError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{editErrors.zipCode}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block font-bold text-[#172b25]" htmlFor="accountPhone">Phone number</label>
                        <input
                          id="accountPhone"
                          type="tel"
                          autoComplete="tel"
                          className="w-full rounded-lg border border-[#dfe5df] px-3 py-2"
                          value={editValues.phone}
                          aria-invalid={Boolean(editErrors.phone)}
                          aria-describedby={editErrors.phone ? 'accountPhoneError' : undefined}
                          onChange={(event) => {
                            setEditValues((current) => ({ ...current, phone: event.target.value }));
                            setEditErrors((current) => ({ ...current, phone: '' }));
                            setEditFeedback(null);
                          }}
                        />
                        {editErrors.phone && <p id="accountPhoneError" className="mt-1 text-sm text-[#8a2f23]" role="alert">{editErrors.phone}</p>}
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#176447] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#125239] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={savingProfile}
                      >
                        {savingProfile ? 'Saving…' : 'Save changes'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Notifications</h2>
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
                    <h2 className="border-b border-[#dfe5df] py-4 text-lg font-semibold text-[#172b25]">Password and Security</h2>
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
