import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { User, Phone, Bell, RotateCcwClock, Save, Settings2, Shield } from 'lucide-react';
import { api } from '../lib/api.js';
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

    async function loadAccount() {
      try {
        const data = await api('/api/auth/me');
        if (!active) return;
        setProfile(data.profile || null);
        if (!data.profile) {
          setOrdersLoading(false);
          return;
        }

        try {
          const history = await api('/api/auth/orders');
          if (active) setOrders(history.orders || []);
        } catch (error) {
          if (active) setOrdersError(error.message);
        } finally {
          if (active) setOrdersLoading(false);
        }
      } catch (error) {
        if (active) setProfileError(error.message);
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadAccount();
    return () => { active = false; };
  }, []);

  const providers = [...new Set(profile?.linkedProviders || [])];
  const recommendationPreferences = profile?.recommendationPreferences;
  const notifications = profile?.notifications;

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
                    <dl>
                      <DataRow label="Name" value={display(profile.username)} />
                      <DataRow label="Email" value={display(profile.email)} />
                      <DataRow
                        label="Linked accounts"
                        value={providers.length ? providers.map((provider) => provider[0].toUpperCase() + provider.slice(1)).join(', ') : 'No linked accounts'}
                      />
                    </dl>
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
                    <dl>
                      <DataRow label="Home ZIP code" value={display(profile.zipCode)} />
                      <DataRow label="Phone" value={display(profile.phone)} />
                    </dl>
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
