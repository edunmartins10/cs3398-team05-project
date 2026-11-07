import { useEffect, useRef, useState } from 'react';
import { api, postJson } from '../lib/api.js';

const PASSWORD_MIN_LENGTH = 8;

function SignupRequirement({ valid, children }) {
  const className = valid === true
    ? 'text-[#28573a]'
    : valid === false
      ? 'text-[#9b3b32]'
      : 'text-[#63726c]';
  const marker = valid === true ? '✓' : valid === false ? '○' : '·';
  return <li className={className}>{marker} {children}</li>;
}

export default function AuthDialog({ open, onClose, onSignedIn, initialMessage = '' }) {
  const ref = useRef(null);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [signupPolicy, setSignupPolicy] = useState(null);
  const [signupPolicyError, setSignupPolicyError] = useState('');
  const [signupValues, setSignupValues] = useState({ username: '', zipCode: '' });
  const [usernameAvailability, setUsernameAvailability] = useState({ username: '', status: 'idle', error: '' });
  const [signupPassword, setSignupPassword] = useState('');

  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  useEffect(() => { if (open && initialMessage) setMessage(initialMessage); }, [open, initialMessage]);
  useEffect(() => {
    if (!open || mode !== 'register') return undefined;
    let active = true;
    setSignupPolicy(null);
    setSignupPolicyError('');
    api('/api/auth/signup-policy')
      .then(({ policy }) => {
        try {
          if (
            !Number.isInteger(policy?.username?.minLength) ||
            !Number.isInteger(policy?.username?.maxLength) ||
            typeof policy?.username?.pattern !== 'string' ||
            typeof policy?.username?.description !== 'string' ||
            typeof policy?.zipCode?.pattern !== 'string' ||
            typeof policy?.zipCode?.description !== 'string'
          ) {
            throw new Error('Signup policy is incomplete.');
          }
          new RegExp(policy.username.pattern);
          new RegExp(policy.zipCode.pattern);
          if (active) setSignupPolicy(policy);
        } catch {
          if (active) setSignupPolicyError('Signup requirements are misconfigured. Please contact the site administrator.');
        }
      })
      .catch((err) => {
        if (active) setSignupPolicyError(err.message);
      });
    return () => { active = false; };
  }, [open, mode]);

  const username = signupValues.username.trim();
  const usernameLengthValid = Boolean(
    signupPolicy &&
    username.length >= signupPolicy.username.minLength &&
    username.length <= signupPolicy.username.maxLength,
  );
  const usernameCharactersValid = Boolean(
    signupPolicy && username && new RegExp(signupPolicy.username.pattern).test(username),
  );
  const zipCodeValid = Boolean(
    signupPolicy && signupValues.zipCode.trim() &&
    new RegExp(signupPolicy.zipCode.pattern).test(signupValues.zipCode.trim()),
  );

  useEffect(() => {
    if (!open || mode !== 'register' || !usernameLengthValid || !usernameCharactersValid) {
      setUsernameAvailability({ username: '', status: 'idle', error: '' });
      return undefined;
    }

    let active = true;
    const timer = setTimeout(() => {
      setUsernameAvailability({ username, status: 'checking', error: '' });
      api('/api/auth/signup-policy/username-availability', {
        method: 'POST',
        body: JSON.stringify({ username }),
      })
        .then(({ available }) => {
          if (active) {
            setUsernameAvailability({ username, status: available ? 'available' : 'taken', error: '' });
          }
        })
        .catch((err) => {
          if (active) setUsernameAvailability({ username, status: 'error', error: err.message });
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, mode, username, usernameLengthValid, usernameCharactersValid]);

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
            <input
              id="signupUsername"
              name="username"
              autoComplete="username"
              placeholder="Choose a username"
              value={signupValues.username}
              onChange={(event) => setSignupValues((current) => ({ ...current, username: event.target.value }))}
            />
            {signupPolicy && (
              <ul className="fine mt-2 space-y-1" aria-label="Username requirements">
                <SignupRequirement valid={usernameLengthValid && usernameCharactersValid}>
                  {signupPolicy.username.description}
                </SignupRequirement>
                <SignupRequirement
                  valid={usernameAvailability.username === username
                    ? usernameAvailability.status === 'available'
                      ? true
                      : usernameAvailability.status === 'taken'
                        ? false
                        : null
                    : null}
                >
                  {usernameAvailability.username !== username || usernameAvailability.status === 'idle'
                    ? 'Enter a valid username to check availability.'
                    : usernameAvailability.status === 'checking'
                      ? 'Checking username availability…'
                      : usernameAvailability.status === 'available'
                        ? 'Username Available'
                        : usernameAvailability.status === 'taken'
                          ? 'Username Already Taken'
                          : usernameAvailability.error}
                </SignupRequirement>
              </ul>
            )}
            <label htmlFor="signupEmail">Email address</label>
            <input id="signupEmail" name="email" type="text" autoComplete="email" placeholder="you@example.com" />
            <label htmlFor="signupPassword">Password</label>
            <input
              id="signupPassword"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Password"
              value={signupPassword}
              onChange={(event) => setSignupPassword(event.target.value)}
            />
            {/* Keep this guidance in sync with the Supabase Auth password policy. */}
            <ul className="fine mt-2 space-y-1" aria-label="Password requirements">
              <SignupRequirement valid={signupPassword.length >= PASSWORD_MIN_LENGTH}>
                Use at least {PASSWORD_MIN_LENGTH} characters.
              </SignupRequirement>
            </ul>
            <label htmlFor="zipCode">Home ZIP code</label>
            <input
              id="zipCode"
              name="zipCode"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="ZIP code"
              value={signupValues.zipCode}
              onChange={(event) => setSignupValues((current) => ({ ...current, zipCode: event.target.value }))}
            />
            {signupPolicy && (
              <ul className="fine mt-2 space-y-1" aria-label="ZIP code requirements">
                <SignupRequirement valid={zipCodeValid}>{signupPolicy.zipCode.description}</SignupRequirement>
              </ul>
            )}
            {signupPolicyError && <div className="form-error" role="alert">{signupPolicyError}</div>}
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
