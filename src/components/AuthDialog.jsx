import { useEffect, useRef, useState } from 'react';
import { postJson } from '../lib/api.js';

export default function AuthDialog({ open, onClose, onSignedIn, initialMessage = '' }) {
  const ref = useRef(null);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  useEffect(() => { if (open && initialMessage) setMessage(initialMessage); }, [open, initialMessage]);

  async function submit(event) {
    event.preventDefault();
    setError(''); setMessage(''); setVerificationUrl(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === 'register') {
        const email = String(form.get('email') || '').trim().toLowerCase();
        const confirmEmail = String(form.get('confirmEmail') || '').trim().toLowerCase();
        if (email !== confirmEmail) throw new Error('The email addresses do not match.');
        if (form.get('textUpdates') === 'on' && !String(form.get('phone') || '').trim()) throw new Error('Add a phone number or turn off text updates.');
        const result = await postJson('/api/auth/register', {
          username: form.get('username'), password: form.get('password'), email,
          zipCode: form.get('zipCode'), phone: form.get('phone'), textUpdates: form.get('textUpdates') === 'on',
        });
        setMessage([result.message || 'Check your email for a verification link.', result.locationWarning].filter(Boolean).join(' '));
        setVerificationUrl(result.verificationUrl || '');
        setMode('login');
      } else {
        await postJson('/api/auth/login', { identifier: form.get('identifier'), password: form.get('password') });
        await onSignedIn();
      }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <dialog ref={ref} className="account-dialog" onClose={onClose} onCancel={onClose}>
      <form onSubmit={submit}>
        <div className="dialoghead">
          <div><div className="eyebrow">YOUR BITEWISE ACCOUNT</div><h2>{mode === 'register' ? 'Create an account' : 'Log in'}</h2></div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p>Save your ZIP code and recommendation settings. Your account details stay private.</p>
        <div className="auth-tabs" role="tablist" aria-label="Account options">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
        </div>
        {mode === 'register' ? (
          <>
            <label htmlFor="signupUsername">Username</label>
            <input id="signupUsername" name="username" autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_.-]{3,24}" required placeholder="Choose a username" />
            <label htmlFor="signupEmail">Email address</label>
            <input id="signupEmail" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            <label htmlFor="confirmEmail">Confirm email address</label>
            <input id="confirmEmail" name="confirmEmail" type="email" autoComplete="email" required placeholder="Enter your email again" />
            <label htmlFor="signupPassword">Password</label>
            <input id="signupPassword" name="password" type="password" autoComplete="new-password" minLength={10} required placeholder="At least 10 characters" />
            <label htmlFor="zipCode">Home ZIP code</label>
            <input id="zipCode" name="zipCode" inputMode="numeric" autoComplete="postal-code" pattern="\d{5}" maxLength={5} required placeholder="5-digit US ZIP" />
            <p className="fine location-disclosure">Your ZIP code is looked up through Zippopotam.us to estimate distances. Bitewise stores the approximate ZIP-center coordinates with your account.</p>
            <label htmlFor="signupPhone">Phone number <span className="optional">optional</span></label>
            <input id="signupPhone" name="phone" type="tel" autoComplete="tel" placeholder="(512) 555-0123" />
            <label className="consent"><input type="checkbox" name="textUpdates" /><span>Send me Bitewise text updates. Message and data rates may apply. Reply STOP to opt out.</span></label>
          </>
        ) : (
          <>
            <label htmlFor="identifier">Username or email</label>
            <input id="identifier" name="identifier" autoComplete="username" required placeholder="Username or email address" />
            <label htmlFor="loginPassword">Password</label>
            <input id="loginPassword" name="password" type="password" autoComplete="current-password" required />
          </>
        )}
        {message && <div className="form-message" role="status">{message}{verificationUrl && <a href={verificationUrl}>Verify this email in this preview ↗</a>}</div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account and verify email →' : 'Log in →'}</button>
        {mode === 'register' && <p className="fine form-footnote">We’ll email a one-time confirmation link. You must verify your email before logging in.</p>}
      </form>
    </dialog>
  );
}
