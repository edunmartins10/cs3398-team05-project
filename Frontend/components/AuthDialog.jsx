import { useEffect, useRef, useState } from 'react';
import { postJson } from '../lib/api.js';

export default function AuthDialog({ open, onClose, onSignedIn, initialMessage = '' }) {
  const ref = useRef(null);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  useEffect(() => { if (open && initialMessage) setMessage(initialMessage); }, [open, initialMessage]);

  async function submit(event) {
    event.preventDefault();
    setError(''); setMessage(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === 'register') {
        const result = await postJson('/api/auth/register', {
          username: form.get('username'), password: form.get('password'), email: form.get('email'),
          zipCode: form.get('zipCode'), phone: form.get('phone'), textUpdates: form.get('textUpdates') === 'on',
        });
        if (result.authenticated) {
          await onSignedIn();
        } else {
          setMessage(result.message || 'Account created.');
          setMode('login');
        }
      } else {
        await postJson('/api/auth/login', { email: form.get('email'), password: form.get('password') });
        await onSignedIn();
      }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <dialog ref={ref} className="account-dialog absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" onClose={onClose} onCancel={onClose}>
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
            <input id="signupUsername" name="username" autoComplete="username" placeholder="Choose a username" />
            <label htmlFor="signupEmail">Email address</label>
            <input id="signupEmail" name="email" type="text" autoComplete="email" placeholder="you@example.com" />
            <label htmlFor="signupPassword">Password</label>
            <input id="signupPassword" name="password" type="password" autoComplete="new-password" placeholder="Password" />
            <label htmlFor="zipCode">Home ZIP code</label>
            <input id="zipCode" name="zipCode" inputMode="numeric" autoComplete="postal-code" placeholder="ZIP code" />
            <p className="fine location-disclosure">Your ZIP code is saved with your account for future location features.</p>
            <label htmlFor="signupPhone">Phone number <span className="optional">optional</span></label>
            <input id="signupPhone" name="phone" type="tel" autoComplete="tel" placeholder="(512) 555-0123" />
            <label className="consent"><input type="checkbox" name="textUpdates" /><span>Send me Bitewise text updates. Message and data rates may apply. Reply STOP to opt out.</span></label>
          </>
        ) : (
          <>
            <label htmlFor="loginEmail">Email address</label>
            <input id="loginEmail" name="email" type="text" autoComplete="email" placeholder="you@example.com" />
            <label htmlFor="loginPassword">Password</label>
            <input id="loginPassword" name="password" type="password" autoComplete="current-password" />
          </>
        )}
        {message && <div className="form-message" role="status">{message}</div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account →' : 'Log in →'}</button>
        {mode === 'register' && <p className="fine form-footnote">Please verify your email before logging in. Check your inbox and spam folder for the confirmation link.</p>}
      </form>
    </dialog>
  );
}
