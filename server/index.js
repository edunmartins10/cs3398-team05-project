import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const dataDirectory = process.env.BITEWISE_DATA_DIR || path.join(root, 'data');
const databasePath = path.join(dataDirectory, 'accounts.json');
const production = process.env.NODE_ENV === 'production';
const cookieName = 'bitewise_session';
const sessionDays = 14;
const knownZipCenters = {
  '78666': { latitude: 29.8833, longitude: -97.9414, label: 'San Marcos, TX' },
  '78640': { latitude: 29.9895, longitude: -97.8772, label: 'Kyle, TX' },
  '78130': { latitude: 29.7030, longitude: -98.1245, label: 'New Braunfels, TX' },
  '78701': { latitude: 30.2672, longitude: -97.7431, label: 'Austin, TX' },
  '78610': { latitude: 30.0860, longitude: -97.8430, label: 'Buda, TX' },
  '78205': { latitude: 29.4252, longitude: -98.4946, label: 'San Antonio, TX' },
};
const allowedRadii = new Set(['5', '10', '15', '20', 'infinity']);
const rateBuckets = new Map();
let database = { users: [], sessions: [] };

async function loadDatabase() {
  await mkdir(dataDirectory, { recursive: true, mode: 0o700 });
  try { database = JSON.parse(await readFile(databasePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; await persist(); }
  if (!Array.isArray(database.users)) database.users = [];
  if (!Array.isArray(database.sessions)) database.sessions = [];

  for (const user of database.users) {
  if (!user.recommendationPreferences) {
    user.recommendationPreferences = {
      budget: 10,
      goal: 'value',
      excludedAllergens: [],
    };
  }

  if (!Array.isArray(user.orderHistory)) {
    user.orderHistory = [];
  }
}
}

async function persist() {
  await mkdir(dataDirectory, { recursive: true, mode: 0o700 });
  const temporary = `${databasePath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(database, null, 2), { mode: 0o600 });
  await rename(temporary, databasePath);
}

const digest = (value) => createHash('sha256').update(value).digest('hex');
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left)); const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
};
function sessionSecret() {
  if (process.env.COOKIE_SECRET) return process.env.COOKIE_SECRET;
  if (production) throw new Error('COOKIE_SECRET must be set before production startup.');
  return 'development-only-bitewise-cookie-secret-change-before-deploying';
}
const cookieSignature = (token) => createHmac('sha256', sessionSecret()).update(token).digest('hex');

function getCookie(request, name) {
  const cookies = String(request.headers.cookie || '').split(';');
  for (const part of cookies) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function setSessionCookie(response, token, maxAge) {
  const value = token ? `${token}.${cookieSignature(token)}` : '';
  const flags = [`${cookieName}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (production) flags.push('Secure');
  response.setHeader('Set-Cookie', flags.join('; '));
}

function publicProfile(user) {
  return {
    username: user.username, email: user.email, zipCode: user.zipCode,
    latitude: user.latitude, longitude: user.longitude, phone: user.phone || '',
    textUpdates: Boolean(user.textUpdates), limitRecommendations: user.limitRecommendations !== false,
    radiusMiles: user.radiusMiles || '5',
  };
}

function sendJson(response, status, data, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw Object.assign(new Error('Request is too large.'), { status: 413 });
  }
  if (!body) return {};
  try { return JSON.parse(body); }
  catch { throw Object.assign(new Error('Request must be valid JSON.'), { status: 400 }); }
}

function normalizePhone(value) {
  const entered = String(value || '').trim();
  if (!entered) return '';
  const digits = entered.replace(/\D/g, '');
  const normalized = entered.startsWith('+') ? `+${digits}` : digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith('1') ? `+${digits}` : '';
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error('Enter a valid phone number, including a country code for numbers outside the U.S.');
  return normalized;
}

async function geocodeZip(zipCode) {
  if (!/^\d{5}$/.test(String(zipCode))) throw new Error('Enter a valid 5-digit U.S. ZIP code.');
  if (knownZipCenters[zipCode]) return knownZipCenters[zipCode];
  const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zipCode)}`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) return null;
  const data = await response.json();
  const place = data.places?.[0];
  if (!place) return null;
  const latitude = Number(place.latitude); const longitude = Number(place.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude, label: `${place['place name']}, ${place['state abbreviation']}` };
}

function clientOrigin(request) {
  const configured = process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, '');
  const origin = request.headers.origin;
  if (origin && !production) return origin.replace(/\/$/, '');
  if (production) throw new Error('APP_ORIGIN must be set before sending email in production.');
  return 'http://localhost:5173';
}

async function deliverVerificationEmail(email, username, token, request) {
  const verificationUrl = `${clientOrigin(request)}/?verify=${encodeURIComponent(token)}`;
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM, to: [email], subject: 'Confirm your Bitewise email',
        text: `Hi ${username}, confirm your Bitewise account by opening this link within 24 hours: ${verificationUrl}`,
        html: `<p>Hi ${escapeHtml(username)},</p><p>Confirm your Bitewise account by opening this link within 24 hours:</p><p><a href="${verificationUrl}">Confirm my email</a></p>`,
      }),
    });
    if (!response.ok) throw new Error('Email verification could not be sent. Check the configured email provider and try again.');
    return { message: 'Check your inbox for a verification link. You must confirm your email before logging in.' };
  }
  if (production) throw new Error('Email verification is not configured. The site owner must configure Resend before registrations can be accepted.');
  console.info(`[Bitewise email verification for ${email}] ${verificationUrl}`);
  return { message: 'Account created. Open the local preview link below to confirm your email.', verificationUrl };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function rateLimited(request, key, limit = 10) {
  const now = Date.now(); const id = `${request.socket.remoteAddress || 'unknown'}:${key}`;
  let bucket = rateBuckets.get(id);
  if (!bucket || now - bucket.start > 60_000) bucket = { start: now, count: 0 };
  bucket.count += 1; rateBuckets.set(id, bucket);
  return bucket.count > limit;
}

function authenticate(request) {
  const signed = getCookie(request, cookieName);
  const split = signed.lastIndexOf('.');
  if (split < 1) return null;
  const token = signed.slice(0, split); const signature = signed.slice(split + 1);
  if (!safeEqual(signature, cookieSignature(token))) return null;
  const hash = digest(token);
  const session = database.sessions.find((item) => safeEqual(item.tokenHash, hash) && item.expiresAt > Date.now());
  return session ? database.users.find((user) => user.id === session.userId && user.emailVerified) || null : null;
}

async function createSession(user, response) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + sessionDays * 24 * 60 * 60 * 1000;
  database.sessions = database.sessions.filter((session) => session.expiresAt > Date.now());
  database.sessions.push({ tokenHash: digest(token), userId: user.id, expiresAt });
  await persist();
  setSessionCookie(response, token, sessionDays * 24 * 60 * 60);
}

async function sendOptInText(phone, username) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM_NUMBER: from } = process.env;
  if (!sid || !token || !from) return false;
  const body = new URLSearchParams({ To: phone, From: from, Body: `Bitewise text updates are on for ${username}. Reply STOP to opt out. Msg & data rates may apply.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
  if (!response.ok) throw new Error('We could not confirm text updates with the SMS provider. Try again or turn off text updates.');
  return true;
}

async function handleApi(request, response, url) {
  const { pathname } = url;

    if (request.method === 'PUT' && pathname === '/api/recommendations/preferences') {
  const user = authenticate(request);

  if (!user) {
    return sendJson(response, 401, {
      error: 'Log in to save recommendation preferences.'
    });
  }

  const data = await readJson(request);

  const budget = Number(data.budget);
  const allowedGoals = ['value', 'dietary', 'personalized'];

  if (!Number.isFinite(budget) || budget <= 0 || budget > 1000) {
    return sendJson(response, 400, {
      error: 'Budget must be between $0.01 and $1000.'
    });
  }

  if (!allowedGoals.includes(data.goal)) {
    return sendJson(response, 400, {
      error: 'Invalid recommendation goal.'
    });
  }

  if (
    !Array.isArray(data.excludedAllergens) ||
    data.excludedAllergens.length > 30 ||
    !data.excludedAllergens.every(
      allergen => typeof allergen === 'string' &&
        allergen.trim().length > 0 &&
        allergen.length <= 50
    )
  ) {
    return sendJson(response, 400, {
      error: 'Invalid allergen preferences.'
    });
  }

  user.recommendationPreferences = {
    budget,
    goal: data.goal,
    excludedAllergens: [...new Set(
      data.excludedAllergens.map(allergen => allergen.trim().toLowerCase())
    )]
  };

  await persist();

  return sendJson(response, 200, {
    preferences: user.recommendationPreferences
  });
}
///////////////////////////////

if (request.method === 'GET' && pathname === '/api/recommendations/preferences') {
  const user = authenticate(request);

  if (!user) {
    return sendJson(response, 401, {
      error: 'Log in to view recommendation preferences.'
    });
  }

  return sendJson(response, 200, {
    preferences: user.recommendationPreferences ?? {
      budget: 10,
      goal: 'value',
      excludedAllergens: []
    }
  });
}

if (request.method === 'GET' && pathname === '/api/recommendations/history') {
  const user = authenticate(request);

  if (!user) {
    return sendJson(response, 401, {
      error: 'Log in to view order history.'
    });
  }

  return sendJson(response, 200, {
    history: user.orderHistory ?? []
  });
}

if (request.method === 'POST' && pathname === '/api/recommendations/history') {
  const user = authenticate(request);

  if (!user) {
    return sendJson(response, 401, {
      error: 'Log in to record an order.'
    });
  }

  const data = await readJson(request);

  const mealName = String(data.mealName ?? '').trim();
  const restaurantName = String(data.restaurantName ?? '').trim();
  const category = String(data.category ?? '').trim();

  if (
    !mealName || mealName.length > 150 ||
    !restaurantName || restaurantName.length > 150 ||
    !category || category.length > 100
  ) {
    return sendJson(response, 400, {
      error: 'A valid meal name, restaurant name, and category are required.'
    });
  }

  const order = {
    id: randomBytes(16).toString('hex'),
    mealName,
    restaurantName,
    category,
    orderedAt: new Date().toISOString()
  };

  if (!Array.isArray(user.orderHistory)) {
    user.orderHistory = [];
  }

  user.orderHistory.push(order);

  await persist();

  return sendJson(response, 201, {
    order
  });
}

////////////////////

  if (request.method === 'GET' && pathname === '/api/auth/me') {
    const user = authenticate(request);
    return sendJson(response, 200, { profile: user ? publicProfile(user) : null });
  }
  if (request.method === 'POST' && pathname === '/api/auth/register') {
    if (rateLimited(request, 'register', 5)) return sendJson(response, 429, { error: 'Too many attempts. Wait a minute and try again.' });
    const data = await readJson(request);
    const username = String(data.username || '').trim(); const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || ''); const zipCode = String(data.zipCode || '').trim();
    if (!/^[A-Za-z0-9_.-]{3,24}$/.test(username)) return sendJson(response, 400, { error: 'Username must be 3–24 characters and use letters, numbers, dots, dashes, or underscores.' });
    if (password.length < 10 || password.length > 256) return sendJson(response, 400, { error: 'Password must be at least 10 characters.' });
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(response, 400, { error: 'Enter a valid email address.' });
    if (!/^\d{5}$/.test(zipCode)) return sendJson(response, 400, { error: 'Enter a valid 5-digit U.S. ZIP code.' });
    if (database.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) return sendJson(response, 409, { error: 'That username is already in use.' });
    if (database.users.some((user) => user.email === email)) return sendJson(response, 409, { error: 'An account already uses that email address.' });
    let phone;
    try { phone = normalizePhone(data.phone); } catch (error) { return sendJson(response, 400, { error: error.message }); }
    const textUpdates = data.textUpdates === true;
    if (textUpdates && !phone) return sendJson(response, 400, { error: 'Add a valid phone number or turn off text updates.' });
    const location = await geocodeZip(zipCode).catch(() => null);
    const salt = randomBytes(16).toString('hex');
    const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
    const verifyToken = randomBytes(32).toString('hex');
    const user = {
      id: randomBytes(16).toString('hex'), username, email, passwordSalt: salt, passwordHash,
      zipCode, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null,
      phone, textUpdates, smsConsentAt: textUpdates ? new Date().toISOString() : null,
      limitRecommendations: true, radiusMiles: '5', emailVerified: false,
      verificationHash: digest(verifyToken), verificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000,

      recommendationPreferences: {
  budget: 10,
  goal: 'value',
  excludedAllergens: [],
},
orderHistory: [],

      createdAt: new Date().toISOString(),
    };
    let delivery;
    try { delivery = await deliverVerificationEmail(email, username, verifyToken, request); }
    catch (error) { return sendJson(response, 503, { error: error.message || 'Verification email could not be sent. Please try again.' }); }
    database.users.push(user); await persist();
    const responseBody = { message: delivery.message, ...(delivery.verificationUrl ? { verificationUrl: delivery.verificationUrl } : {}) };
    if (!location) responseBody.locationWarning = 'The account was created, but this ZIP could not be mapped. You can still use the app; distance filtering will be paused.';
    return sendJson(response, 201, responseBody);
  }
  if (request.method === 'POST' && pathname === '/api/auth/verify') {
    const { token } = await readJson(request);
    const hash = digest(String(token || ''));
    const user = database.users.find((item) => item.verificationHash && safeEqual(item.verificationHash, hash));
    if (!user || user.verificationExpiresAt < Date.now()) return sendJson(response, 400, { error: 'That verification link is invalid or expired. Create a new account or request a new link.' });
    user.emailVerified = true; user.verificationHash = null; user.verificationExpiresAt = null;
    await persist();
    if (user.textUpdates) sendOptInText(user.phone, user.username).catch((error) => console.error('Welcome text could not be sent:', error.message));
    return sendJson(response, 200, { ok: true });
  }
  if (request.method === 'POST' && pathname === '/api/auth/login') {
    if (rateLimited(request, 'login', 10)) return sendJson(response, 429, { error: 'Too many login attempts. Wait a minute and try again.' });
    const data = await readJson(request); const identifier = String(data.identifier || '').trim().toLowerCase();
    const user = database.users.find((item) => item.username.toLowerCase() === identifier || item.email === identifier);
    if (!user) return sendJson(response, 401, { error: 'The username/email or password is incorrect.' });
    const candidate = (await scrypt(String(data.password || ''), user.passwordSalt, 64)).toString('hex');
    if (!safeEqual(candidate, user.passwordHash)) return sendJson(response, 401, { error: 'The username/email or password is incorrect.' });
    if (!user.emailVerified) return sendJson(response, 403, { error: 'Confirm your email using the link we sent before logging in.' });
    await createSession(user, response);
    return sendJson(response, 200, { profile: publicProfile(user) });
  }
  if (request.method === 'POST' && pathname === '/api/auth/logout') {
    const signed = getCookie(request, cookieName); const token = signed.slice(0, signed.lastIndexOf('.'));
    if (token) database.sessions = database.sessions.filter((item) => !safeEqual(item.tokenHash, digest(token)));
    await persist(); setSessionCookie(response, '', 0);
    return sendJson(response, 200, { ok: true });
  }
  if (request.method === 'PUT' && pathname === '/api/profile') {
    const user = authenticate(request);
    if (!user) return sendJson(response, 401, { error: 'Log in to edit account settings.' });
    const data = await readJson(request); const zipCode = String(data.zipCode || '').trim();
    if (!/^\d{5}$/.test(zipCode)) return sendJson(response, 400, { error: 'Enter a valid 5-digit U.S. ZIP code.' });
    let phone;
    try { phone = normalizePhone(data.phone); } catch (error) { return sendJson(response, 400, { error: error.message }); }
    const textUpdates = data.textUpdates === true;
    if (textUpdates && !phone) return sendJson(response, 400, { error: 'Add a valid phone number or turn off text updates.' });
    const radiusMiles = String(data.radiusMiles || '5');
    if (!allowedRadii.has(radiusMiles)) return sendJson(response, 400, { error: 'Choose 5, 10, 15, 20 miles, or any distance.' });
    const location = zipCode === user.zipCode && user.latitude ? { latitude: user.latitude, longitude: user.longitude } : await geocodeZip(zipCode).catch(() => null);
    if (textUpdates && !user.textUpdates) {
      try { await sendOptInText(phone, user.username); }
      catch (error) { return sendJson(response, 502, { error: error.message }); }
    }
    user.zipCode = zipCode; user.latitude = location?.latitude ?? null; user.longitude = location?.longitude ?? null;
    user.phone = phone; user.textUpdates = textUpdates; user.limitRecommendations = data.limitRecommendations !== false;
    user.radiusMiles = radiusMiles; user.smsConsentAt = textUpdates ? user.smsConsentAt || new Date().toISOString() : null;
    await persist();
    return sendJson(response, 200, { profile: publicProfile(user), smsDeliveryConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) });
  }
  if (request.method === 'GET' && pathname.startsWith('/api/geo/')) {
    const zipCode = decodeURIComponent(pathname.slice('/api/geo/'.length));
    const location = await geocodeZip(zipCode).catch(() => null);
    if (!location) return sendJson(response, 404, { error: 'That ZIP code could not be mapped. Try a different ZIP code.' });
    return sendJson(response, 200, location);
  }
  if (request.method === 'POST' && pathname === '/api/donations/checkout') {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return sendJson(response, 503, { error: 'Donations are not enabled yet. The site owner must configure Stripe Checkout.' });
    const data = await readJson(request); const amountCents = Number(data.amountCents);
    if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 50_000) return sendJson(response, 400, { error: 'Donation must be between $1 and $500.' });
    let origin;
    try { origin = clientOrigin(request); } catch (error) { return sendJson(response, 503, { error: error.message }); }
    const form = new URLSearchParams({
      mode: 'payment', success_url: `${origin}/?donation=success`, cancel_url: `${origin}/?donation=cancelled`,
      'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(amountCents),
      'line_items[0][price_data][product_data][name]': 'One-time donation to Bitewise',
      'line_items[0][price_data][product_data][description]': 'Support the Bitewise project',
    });
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
    }).catch(() => null);
    if (!stripeResponse?.ok) return sendJson(response, 502, { error: 'Secure checkout could not be started. Please try again later.' });
    const session = await stripeResponse.json();
    if (!session.url) return sendJson(response, 502, { error: 'Secure checkout did not return a payment link.' });
    return sendJson(response, 200, { checkoutUrl: session.url });
  }
  return sendJson(response, 404, { error: 'API route not found.' });
}

const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
async function serveBuiltFile(request, response, url) {
  const dist = path.join(root, 'dist');
  let target = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
  if (!target.startsWith(`${dist}${path.sep}`)) return sendJson(response, 403, { error: 'Forbidden.' });
  try { if ((await (await import('node:fs/promises')).stat(target)).isDirectory()) target = path.join(target, 'index.html'); }
  catch { target = path.join(dist, 'index.html'); }
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(target)] || 'application/octet-stream' });
  createReadStream(target).pipe(response);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(request, response, url);
    if (production && request.method === 'GET') return await serveBuiltFile(request, response, url);
    return sendJson(response, 404, { error: 'Not found.' });
  } catch (error) {
    console.error(error);
    if (!response.headersSent) sendJson(response, error.status || 500, { error: error.status ? error.message : 'The request could not be completed.' });
    else response.destroy();
  }
});

await loadDatabase();
const port = Number(process.env.API_PORT || process.env.PORT || 3001);
server.listen(port, () => console.info(`Bitewise account API listening on http://localhost:${port}`));
