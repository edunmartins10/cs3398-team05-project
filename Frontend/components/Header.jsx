import { Link, NavLink } from 'react-router-dom';
import AuthDialog from './AuthDialog.jsx';
import { useEffect, useState } from 'react';
import { api, AUTH_CHANGED_EVENT, PROFILE_UPDATED_EVENT, postJson } from '../lib/api.js';
import { MdAccountCircle } from "react-icons/md";
import DonationDialog from './DonationDialog.jsx';
import { FaUserCog, FaInfoCircle } from "react-icons/fa";
import { FaArrowRotateLeft, FaRegHeart } from "react-icons/fa6";

export default function Header() {
  const [profile, setProfile] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [managementMenuOpen, setManagementMenuOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api('/api/auth/me');
        setProfile(data.profile || null);
      } catch {
        setProfile(null);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    function updateProfile(event) {
      setProfile((current) => ({ ...current, ...event.detail }));
    }
    window.addEventListener(PROFILE_UPDATED_EVENT, updateProfile);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, updateProfile);
  }, []);

  async function signedIn() {
    const data = await api('/api/auth/me');
    setProfile(data.profile || null);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    setAuthOpen(false);
    setNotice(`Welcome back, ${data.profile?.username || 'friend'}.`);
    setNoticeError(false);
  }

  async function signOut() {
    try {
      await postJson('/api/auth/logout', {});
    } catch {
      // Keep the local view in sync even if the request fails.
    }
    setProfile(null);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    setNotice('You have been logged out.');
    setNoticeError(false);
  }

  function openAuth() {
    setManagementMenuOpen(false);
    setAuthOpen(true);
  }

  return (
    <>
      <header className="items-center justify-between header">
          <Link className="brand" to="/">
          <span className="brandmark">b.</span>bitewise
          </Link>
        <span className="headernote">Good food. Smarter spending.</span>
        <nav className="header-actions" aria-label="Main actions">
          <button className="text-button donate-nav" type="button" onClick={() => setDonationOpen(true)}>
            Donate
          </button>
          <button
            className="size-10 place-items-center rounded-full bg-transparent p-0 transition-colors hover:bg-[#edf3e9] hover:text-[#172b25] items-center justify-center text-[#176447] focus:outline-none focus:ring-2 focus:ring-[#176447]"
            type="button"
            aria-label="Open account menu"
            aria-expanded={managementMenuOpen}
            onClick={() => setManagementMenuOpen((isOpen) => !isOpen)}
          >
            <MdAccountCircle
              className="size-10 text-[#176447]" 
              aria-hidden="true" 
            />
          </button>

        </nav>
      </header>

      <nav className="site-nav" aria-label="Main navigation">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/faq">FAQ</NavLink>
        <NavLink to="/account">Account</NavLink>
      </nav>

      {managementMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={(event) => {
            if (event.target === event.currentTarget) setManagementMenuOpen(false);
          }}
        >
          <div className="absolute right-[5.5%] top-[76px] w-[min(340px,calc(100vw-28px))] overflow-hidden rounded-lg border border-[#dfe5df] bg-white shadow-[0_16px_42px_rgba(23,43,37,0.16)]" role="region" aria-label="Account menu">
          
          {profile ? (
            // User Logged In
            <div className="flex w-full flex-col items-center justify-center gap-2 p-5">
              <p className="font-bold text-[#172b25]">Hi {profile.username}</p>

              <div className="grid grid-cols-2 gap-2 w-full">
                <Link className="flex flex-col items-center justify-center gap-1 rounded-md border border-[#dfe5df] bg-[#f6f8f5] px-3.5 py-3.5 text-center transition-colors hover:bg-[#edf3e9]" to="/account" state={{activeTab: 'order_history'}}>
                  <FaArrowRotateLeft className="size-8 text-[#172b25]" />
                  <span className="text-[13px] text-[#172b25]">Past Orders</span>
                </Link>

                <Link className="flex flex-col items-center justify-center gap-1 rounded-md border border-[#dfe5df] bg-[#f6f8f5] px-3.5 py-3.5 text-center transition-colors hover:bg-[#edf3e9]" to="/account" state={{activeTab: 'saved_orders'}}>
                  <FaRegHeart className="size-8 text-[#172b25]" />
                  <span className="text-[13px] text-[#172b25]">Saved</span>
                </Link>

                <Link className="flex flex-col items-center justify-center gap-1 rounded-md border border-[#dfe5df] bg-[#f6f8f5] px-3.5 py-3.5 text-center transition-colors hover:bg-[#edf3e9]" to="/account" state={{activeTab: 'account'}}>
                  <FaUserCog className="size-8 text-[#172b25]" />
                  <span className="text-[13px] text-[#172b25]">Account</span>
                </Link>

                <Link className="flex flex-col items-center justify-center gap-1 rounded-md border border-[#dfe5df] bg-[#f6f8f5] px-3.5 py-3.5 text-center transition-colors hover:bg-[#edf3e9]" to="/account" state={{activeTab: 'preferences'}}>
                  <FaInfoCircle className="size-8 text-[#172b25]" />
                  <span className="text-[13px] text-[#172b25]">Preferences</span>
                </Link>

              </div>

              <div className="flex w-full flex-col items-center justify-center border-t border-[#dfe5df] py-2">
                <button className="block w-full px-1 py-3.5 text-center text-[13px] text-[#63726c] hover:text-[#172b25]" type="button" onClick={() => {signOut(); setManagementMenuOpen(false);}}>
                  Not you? <strong className="text-[#176447]">Sign out</strong>
                </button>
              </div>

            </div>
          ) : (
            // User Not Logged In
            <div className="p-5">
              <div className="px-0.5 pb-4">
                <span className="text-[10px] font-bold tracking-[1.4px] text-[#176447]">BITEWISE ACCOUNT</span>
                <h2 className="mt-1.5 text-[22px] font-semibold text-[#172b25]">Make it yours.</h2>
                <p className="mt-1 text-[13px] leading-5 text-[#63726c]">Save your preferences and find better-value meals.</p>
              </div>
              <button className="flex w-full items-center justify-between rounded-md bg-[#176447] px-3.5 py-3 text-left font-bold text-white transition-colors hover:bg-[#104e38]" type="button" onClick={openAuth}>
                Create an account <span aria-hidden="true" className="text-lg leading-none">→</span>
              </button>
              <button className="block w-full px-1 py-3.5 text-center text-[13px] text-[#63726c] hover:text-[#172b25]" type="button" onClick={openAuth}>
                Already a member? <strong className="text-[#176447]">Log in</strong>
              </button>
              <button
                className="-mx-5 -mb-5 flex w-[calc(100%+40px)] items-center gap-3 border-t border-[#dfe5df] bg-[#f6f8f5] px-5 py-3.5 text-left transition-colors hover:bg-[#edf3e9]"
                type="button"
                onClick={() => {
                  setManagementMenuOpen(false);
                  document.querySelector('main aside')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#dfff80] text-xl text-[#176447]" aria-hidden="true">⌕</span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-[13px] text-[#172b25]">Search with filters</strong>
                  <small className="mt-0.5 block text-[11px] leading-4 text-[#63726c]">Set a budget, dietary needs, and more</small>
                </span>
                <span className="text-[17px] text-[#176447]" aria-hidden="true">↗</span>
              </button>
            </div>
          )}

          </div>
          
        </div>
      )}

      {notice && (
        <div className={`notice ${noticeError ? 'notice-error' : ''}`} role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button>
        </div>
      )}

      <AuthDialog
        className="justify-center items-center"
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignedIn={signedIn}
        initialMessage={notice}
      />

      <DonationDialog
        open={donationOpen}
        onClose={() => setDonationOpen(false)}
        onError={(message) => {
          setNotice(message);
          setNoticeError(true);
        }}
      />
    </>
  );
}
