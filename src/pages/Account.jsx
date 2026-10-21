import React, { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import { User, Phone, Bell, LogOut, Check, RotateCcwClock, Save, Settings2, Shield } from 'lucide-react';
import { api, postJson, putJson } from '../lib/api.js';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: 'Software engineer building web applications.',
    emailNotifications: true,
    securityAlerts: true,
  });

  useEffect(() => {
    api('/api/auth/me')
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setFormData((prev) => ({
            ...prev,
            name: data.profile.username || '',
            email: data.profile.email || '',
          }));
        }
      })
      .catch(() => setProfile(null));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  async function signOut() {
    try { await postJson('/api/auth/logout', {}); } catch {}
    setProfile(null);
    setNotice('You have been logged out.');
  }

  function Profile() {
    return (
        <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[#172b25] font-['Space_Grotesk']">Public Profile</h2>
                  <div>
                    <label className="block text-xs font-bold text-[#63726c] uppercase tracking-wider mb-1">
                      Full Name / Username
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#cbd6cb] rounded-lg px-3 py-2 text-sm text-[#172b25] focus:outline-none focus:ring-2 focus:ring-[#40936b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#63726c] uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#cbd6cb] rounded-lg px-3 py-2 text-sm text-[#172b25] focus:outline-none focus:ring-2 focus:ring-[#40936b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#63726c] uppercase tracking-wider mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#cbd6cb] rounded-lg px-3 py-2 text-sm text-[#172b25] focus:outline-none focus:ring-2 focus:ring-[#40936b]"
                    />
                  </div>
                </div>
    )
  }

  function Security(){
    return(
        <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[#172b25] font-['Space_Grotesk']">Security Settings</h2>
                  <div>
                    <label className="block text-xs font-bold text-[#63726c] uppercase tracking-wider mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#cbd6cb] rounded-lg px-3 py-2 text-sm text-[#172b25] focus:outline-none focus:ring-2 focus:ring-[#40936b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#63726c] uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#cbd6cb] rounded-lg px-3 py-2 text-sm text-[#172b25] focus:outline-none focus:ring-2 focus:ring-[#40936b]"
                    />
                  </div>
                  <div className="pt-4 border-t border-[#dfe5df] flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-[#172b25]">Two-Factor Authentication</p>
                      <p className="text-xs text-[#63726c]">Add an extra layer of security to your account.</p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium bg-[#f6f8f5] hover:bg-[#edf3e9] text-[#172b25] rounded-lg border border-[#cbd6cb] transition"
                    >
                      Enable 2FA
                    </button>
                  </div>
                </div>
    )
  }

  function OrderHistory(){

  }

  function SavedOrders(){

  }

  function Preferences(){

  }

  function AddressAndPhone(){

  }

  function Notifications(){

    return (
        <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[#172b25] font-['Space_Grotesk']">Notification Preferences</h2>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-[#172b25]">Email Notifications</span>
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleChange}
                        className="rounded border-[#cbd6cb] bg-white text-[#176447] focus:ring-[#40936b] h-4 w-4"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-[#172b25]">Security Alerts</span>
                      <input
                        type="checkbox"
                        name="securityAlerts"
                        checked={formData.securityAlerts}
                        onChange={handleChange}
                        className="rounded border-[#cbd6cb] bg-white text-[#176447] focus:ring-[#40936b] h-4 w-4"
                      />
                    </label>
                  </div>
                </div>
    )

  }

  return (
    <>
      <Header
        profile={profile}
        onSignOut={signOut}
      />

      <main className="max-w-[1320px] px-[46px] pt-[34px] mx-auto">
        <div className="border-b border-[#dfe5df] pb-6 mb-8">
          <h1 className="text-[36px] font-bold tracking-tight text-[#172b25] font-['Space_Grotesk']">
            Account Settings
          </h1>
          <p className="text-sm text-[#63726c] mt-1">
            Manage your personal information, security preferences, and account settings.
          </p>
        </div>

        {notice && (
          <div className="flex justify-between items-center mb-[18px] p-[12px_15px] border border-[#cfe0d2] bg-[#eef6ee] rounded-[9px] text-[#28573a] text-sm">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} className="text-xl">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-9 mb-12 h-full">
          {/* Sidebar */}
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0 bg-white border border-[#dfe5df] rounded-[16px] p-6 h-fit">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'order_history', label: 'Order History', icon: RotateCcwClock},
              { id: 'saved_orders', label: "Saved Orders", icon: Save },
              { id: 'preferenes', label: "Preferences", icon: Settings2 },
              { id: 'address_and_phone', label: "Address & Phone", icon: Phone },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'secutiry', label: "Password & Security", icon: Shield},
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left w-full ${
                  activeTab === id
                    ? 'bg-[#edf3e9] text-[#176447] font-bold'
                    : 'text-[#63726c] hover:text-[#172b25] hover:bg-[#f6f8f5]'
                }`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Main Form Content */}
          <main className="md:col-span-3">
            <form onSubmit={handleSave} className="bg-white border border-[#dfe5df] rounded-[16px] p-6 space-y-6 shadow-sm">
              
              {activeTab === 'profile' && (<Profile />)}
              {activeTab === 'security' && (<Security />)}
              {activeTab === 'notifications' && (<Notifications />)}

            </form>
          </main>
        </div>

        <footer className="fixed bottom-0 py-[26px] border-t border-[#dfe5df] flex items-center gap-[25px] text-[#63726c] text-[13px]">
          <span className="font-['Space_Grotesk'] font-bold text-[22px] text-[#172b25]">bitewise.</span>
          <span>A little math. A better lunch.</span>
          <a href="https://unsplash.com/photos/burger-with-lettuce-and-fries-PxJ9zkM2wdA" target="_blank" rel="noreferrer" className="ml-auto text-xs text-[#63726c]">Photo: Unsplash ↗</a>
        </footer>
      </main>
    </>
  );
}