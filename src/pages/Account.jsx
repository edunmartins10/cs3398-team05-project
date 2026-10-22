import React, { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import { User, Phone, Bell, RotateCcwClock, Save, Settings2, Shield } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaFacebookSquare } from "react-icons/fa";
import { api, postJson, putJson } from '../lib/api.js';
import Footer from '../components/Footer.jsx';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('account');
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

  function Account() {
    return (
      <div className="h-full w-full space-y-4 border-black">
        <h2 className="text-lg font-semibold text-[#172b25] py-4 border-b border-[#dfe5df]">Your Account</h2>
        <div className="w-full py-4 border-b border-[#dfe5df]">
          <h3 className="text-md font-bold text-[#172b25]">Name</h3>
          <p>Sample Name</p>
        </div>
        <div className="w-full py-4 border-b border-[#dfe5df]">
          <h3 className="text-md font-bold text-[#172b25]">Email</h3>
          <p>sample@example.com</p>
        </div>
        <div className="w-full py-4 border-b border-[#dfe5df]">
          <h3 className="text-md font-bold text-[#172b25]">Linked Accounts</h3>
          <li className="flex flex-col space-y-2 mt-2 items-center">
            <span className="flex flex-row items-center text-[#172b25] space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full bg-[#f6f8f5] text-[#172b25]">
              <FcGoogle className="inline-block mr-2" size={32} />
              Connect To Google
            </span>
            <span className="flex flex-row items-center text-[#172b25] space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full bg-[#f6f8f5] text-[#172b25]">
              <FaFacebook className="inline-block mr-2 text-[#1877F2]" size={32} />
              Connect To Facebook
            </span>
          </li>
        </div>
  
      </div>
    )
  }

  function Security(){
    return(
      <div className="h-full w-full space-y-4 border-black">
        <h2 className="text-lg font-semibold text-[#172b25] py-4 border-b border-[#dfe5df]">Security</h2>
      </div>
    )
  }

  function OrderHistory(){

	  return(
      <div className="h-full w-full space-y-4 border-black">
        <h2 className="text-lg font-semibold text-[#172b25] py-4 border-b border-[#dfe5df]">Order History</h2>
        <h3 className="text-center text-2xl py-4 font-medium text-[#172b25]/100">You Dont Have Any Recent Orders.</h3>
      </div>
    )

  }

  function SavedOrders(){
    return(
      <div className="h-full w-full space-y-4 border-black">
        <h2 className="text-lg font-semibold text-[#172b25] py-4 border-b border-[#dfe5df]">Saved Orders</h2>
        <h3 className="text-center text-2xl py-4 font-medium text-[#172b25]/100">You Dont Have Any Saved Orders.</h3>
      </div>
    )

  }

  function Preferences(){
	  return(
      <div className="h-full w-full space-y-4 border-black">
        <h2 className="text-lg font-semibold text-[#172b25] py-4 border-b border-[#dfe5df]">Preferences</h2>
        
      </div>
    )

  }

  function AddressAndPhone(){
	  return (
      <div className="flex flex-col space-y-4 h-full w-full border-black">
        <h2 className="text-lg font-semibold text-[#172b25] py-4 border-b border-[#dfe5df]">Address and Phone</h2>

        <div className="w-full py-4 border-b border-[#dfe5df]">
          <h3 className="text-lg font-bold text-[#172b25]">Address</h3>
          <p>123 Sample Street</p>
        </div>
        <div className="w-full py-4 border-b border-[#dfe5df]">
          <h3 className="text-lg font-bold text-[#172b25]">Phone</h3>
          <p>(123) 456-7890</p>
        </div>
  
      </div>
      )
  }

  function Notifications(){

    return(
      <div className="h-full w-full space-y-4 border-black">
        <h2 className="text-lg font-semibold text-[#172b25] py-4 border-b border-[#dfe5df]">Notifications</h2>
        <label class="check">
    <input type="checkbox"/>
    <div className="flex flex-col justify-start">
      <span className="font-bold text-[#172b25] text-lg">Email Notifications</span>
      <small>Receive updates about your account and saved items.</small>
    </div>
  </label>

  <label class="check">
    <input type="checkbox"/>
    <div className="flex flex-col justify-start">
      <span className="font-bold text-[#172b25] text-lg">Price Drop Alerts</span>
      <small>Get notified when a tracked item drops in price.</small>
    </div>
  </label>

  <label class="check">
    <input type="checkbox"/>
    <div className="flex flex-col justify-start">
      <span className="font-bold text-[#172b25] text-lg">Weekly Summary Digest</span>
      <small>A weekly recap of activity and recommendations.</small>
    </div>
  </label>
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
        <div className="border-b border-[#dfe5df] pt-6 mb-8">
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

        <div className="flex flex-row justify-around gap-9 mb-12 h-full">
          {/* Sidebar */}
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-4 md:pb-0 bg-white border border-[#dfe5df] rounded-[16px] p-4 h-[480px] overflow-y-visible">
            <button
              key={"account"}
              className={`flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full 
                  ${ activeTab === 'account' ? 'bg-[#edf3e9] text-[#176447] font-bold' : 'text-[#63726c] hover:text-[#172b25] hover:bg-[#f6f8f5]'}`}
              onClick={() => setActiveTab('account')}
            >
              <User />
              <span>Account</span>
            </button>

            <button
              className={`flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full 
                  ${ activeTab === 'order_history' ? 'bg-[#edf3e9] text-[#176447] font-bold' : 'text-[#63726c] hover:text-[#172b25] hover:bg-[#f6f8f5]'}`}
              onClick={() => setActiveTab('order_history')}
            >
              <RotateCcwClock />
              <span>Order History</span>
            </button>

            <button
            className={`flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full 
                  ${ activeTab === 'saved_orders' ? 'bg-[#edf3e9] text-[#176447] font-bold' : 'text-[#63726c] hover:text-[#172b25] hover:bg-[#f6f8f5]'}`}
                  onClick={() => setActiveTab('saved_orders')}
                  >
              <Save />
              <span>Saved Orders</span>
            </button>

            <button
            className={`flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full 
                  ${activeTab === 'preferences' ? 'bg-[#edf3e9] text-[#176447] font-bold' : 'text-[#63726c] hover:text-[#172b25] hover:bg-[#f6f8f5]'}`}
                  onClick={() => setActiveTab('preferences')}
                  >
              <Settings2 />
              <span>Preferences</span>
            </button>

            <button
            className={`flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full 
                  ${activeTab === 'address_and_phone' ? 'bg-[#edf3e9] text-[#176447] font-bold' : 'text-[#63726c] hover:text-[#172b25] hover:bg-[#f6f8f5]'}`}
                  onClick={() => setActiveTab('address_and_phone')}
                  >
              <Phone />
              <span>Address & Phone</span>
            </button>

            <button
            className={`flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full 
                  ${ activeTab === 'notifications' ? 'bg-[#edf3e9] text-[#176447] font-bold' : 'text-[#63726c] hover:text-[#172b25] hover:bg-[#f6f8f5]'}`}
                  onClick={() => setActiveTab('notifications')}
                  >
              <Bell />
              <span>Notifications</span>
            </button>

            <button
              className={`flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-left w-full 
                ${ activeTab === 'security' ? 'bg-[#edf3e9] text-[#176447] font-bold' : 'text-[#63726c] hover:text-[#172b25] hover:bg-[#f6f8f5]'}`}
                  onClick={() => setActiveTab("security")}
                  >
              <Shield />
              <span>Password & Security</span>
            </button>

          </nav>

          {/* Main Form Content */}
          <main className="flex-1 bg-white border border-[#dfe5df] rounded-[16px] p-6 h-[480px] overflow-y-auto">
              
            {activeTab === 'account' && (<Account />)}
	          {activeTab === 'order_history' && (<OrderHistory />)}
	          {activeTab === 'saved_orders' && (<SavedOrders />)}
	          {activeTab === 'preferences' && (<Preferences />)}
	          {activeTab === 'address_and_phone' && (<AddressAndPhone />)}
	          {activeTab === 'notifications' && (<Notifications />)}
            {activeTab === 'security' && (<Security />)}
              
          </main>
        </div>

        <Footer />
      </main>
    </>
  );
}
