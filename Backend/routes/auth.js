import { Router } from 'express';
import {
  authenticatedSupabaseSession,
  SUPABASE_URL,
  supabase,
  userDatabase,
} from '../services/supabase.js';

const router = Router();
const databaseValidationErrors = new Set(['22P02', '22001', '22003', '23514', 'P0001']);

function preferenceValidationField(error) {
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  if (message.includes('budget')) return 'budget';
  if (message.includes('radius')) return 'radiusMiles';
  if (message.includes('goal')) return 'goal';
  if (message.includes('allergen') || message.includes('restriction')) return 'excludedAllergens';
  return null;
}

async function validateSignupProfile(usernameValue, zipCodeValue) {
  const { data: policy, error: policyError } = await supabase.rpc('get_signup_policy');
  if (policyError || !policy) {
    console.error('Could not retrieve signup policy from Supabase:', policyError);
    throw new Error('Could not validate signup requirements. Please try again.');
  }

  const username = typeof usernameValue === 'string' ? usernameValue.trim() : '';
  const zipCode = typeof zipCodeValue === 'string' ? zipCodeValue.trim() : '';
  const errors = [];

  if (!username) {
    errors.push({ field: 'username', message: 'Enter a username.' });
  } else {
    if (username.length < policy.username.minLength) {
      errors.push({ field: 'username', message: `Username must be at least ${policy.username.minLength} characters.` });
    }
    if (username.length > policy.username.maxLength) {
      errors.push({ field: 'username', message: `Username must be no more than ${policy.username.maxLength} characters.` });
    }
    if (!new RegExp(policy.username.pattern).test(username)) {
      errors.push({ field: 'username', message: policy.username.description });
    }

    const usernameFormatValid = username.length >= policy.username.minLength
      && username.length <= policy.username.maxLength
      && new RegExp(policy.username.pattern).test(username);
    if (usernameFormatValid) {
      const { data: available, error: availabilityError } = await supabase.rpc(
        'check_signup_username_available',
        { candidate: username },
      );
      if (availabilityError) {
        console.error('Could not check username availability with Supabase:', availabilityError);
        throw new Error('Could not check username availability. Please try again.');
      }
      if (!available) {
        errors.push({ field: 'username', message: 'Username Already Taken' });
      }
    }
  }

  if (!zipCode) {
    errors.push({ field: 'zipCode', message: 'Enter a ZIP code.' });
  } else if (!new RegExp(policy.zipCode.pattern).test(zipCode)) {
    errors.push({ field: 'zipCode', message: policy.zipCode.description });
  }

  return errors;
}

router.get('/signup-policy', async (req, res) => {
  let data;
  let error;
  try {
    ({ data, error } = await supabase.rpc('get_signup_policy'));
  } catch (requestError) {
    console.error('Could not retrieve signup policy from Supabase:', requestError);
    return res.status(502).json({ error: 'Could not load signup requirements. Please try again.' });
  }
  if (error || !data) {
    console.error('Could not retrieve signup policy from Supabase:', error);
    return res.status(502).json({ error: 'Could not load signup requirements. Please try again.' });
  }

  return res.json({ policy: data });
});

router.post('/signup-policy/username-availability', async (req, res) => {
  const username = req.body?.username;
  if (typeof username !== 'string') {
    return res.status(400).json({ error: 'A username is required.' });
  }

  let data;
  let error;
  try {
    ({ data, error } = await supabase.rpc('check_signup_username_available', {
      candidate: username,
    }));
  } catch (requestError) {
    console.error('Could not check username availability with Supabase:', requestError);
    return res.status(502).json({ error: 'Could not check username availability. Please try again.' });
  }
  if (error) {
    console.error('Could not check username availability with Supabase:', error);
    return res.status(502).json({ error: 'Could not check username availability. Please try again.' });
  }
  return res.json({ available: data === true });
});

router.get('/preferences/options', async (req, res) => {
  try {
    const [goals, restrictions] = await Promise.all([
      supabase
        .from('recommendation_goal_options')
        .select('goal_key, label, winner_label')
        .eq('enabled', true)
        .order('sort_order'),
      supabase
        .from('dietary_restriction_options')
        .select('restriction_key, label')
        .eq('enabled', true)
        .order('sort_order'),
    ]);
    if (goals.error || restrictions.error) {
      console.error('Could not retrieve account preference options from Supabase:', goals.error || restrictions.error);
      return res.status(502).json({ error: 'Could not load preference options. Check the Supabase account-preferences setup.' });
    }
    return res.json({
      recommendationGoals: goals.data,
      dietaryRestrictions: restrictions.data,
    });
  } catch (requestError) {
    console.error('Could not retrieve account preference options from Supabase:', requestError);
    return res.status(502).json({ error: 'Could not load preference options. Check the Supabase account-preferences setup.' });
  }
});

router.get('/me', async (req, res) => {
  const accessToken = req.cookies?.bitewise_session;
  if (!accessToken) return res.json({ profile: null });

  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.getUser(accessToken));
  } catch (requestError) {
    console.error('Could not retrieve the Supabase user:', requestError);
    return res.status(502).json({ error: 'Could not retrieve account profile.' });
  }
  if (error) {
    if (error.status === 401) {
      res.clearCookie('bitewise_session');
      return res.json({ profile: null });
    }
    console.error('Could not retrieve the Supabase user:', error);
    return res.status(502).json({ error: 'Could not retrieve account profile.' });
  }

  const user = data.user;
  if (!user) return res.json({ profile: null });

  const metadata = user.user_metadata || {};
  let profileData;
  try {
    const result = await userDatabase(accessToken)
      .from('profiles')
      .select('username, home_zip, phone_number, recommendation_budget, recommendation_goal, excluded_allergens, limit_recommendations, recommendation_radius_miles')
      .eq('id', user.id)
      .maybeSingle();
    if (result.error) {
      console.error('Could not retrieve the Supabase profile:', result.error);
      return res.status(502).json({ error: 'Could not retrieve account profile.' });
    }
    profileData = result.data;
  } catch (requestError) {
    console.error('Could not retrieve the Supabase profile:', requestError);
    return res.status(502).json({ error: 'Could not retrieve account profile.' });
  }
  return res.json({
    profile: {
      username: profileData ? profileData.username : metadata.username || user.email || '',
      email: user.email || '',
      zipCode: profileData ? profileData.home_zip : metadata.home_zip || metadata.zipCode || '',
      latitude: metadata.latitude ?? null,
      longitude: metadata.longitude ?? null,
      phone: profileData ? profileData.phone_number || '' : metadata.phone || '',
      textUpdates: metadata.textUpdates === true,
      limitRecommendations: profileData
        ? profileData.limit_recommendations
        : metadata.limitRecommendations === true,
      radiusMiles: profileData
        ? profileData.recommendation_radius_miles == null ? 'infinity' : String(profileData.recommendation_radius_miles)
        : metadata.radiusMiles || '10',
      recommendationPreferences: profileData ? {
        budget: profileData.recommendation_budget,
        goal: profileData.recommendation_goal,
        excludedAllergens: profileData.excluded_allergens || [],
      } : null,
      notifications: metadata.notifications || null,
      createdAt: user.created_at || null,
      lastSignInAt: user.last_sign_in_at || null,
      emailConfirmedAt: user.email_confirmed_at || null,
      linkedProviders: (user.identities || []).map((identity) => identity.provider),
    },
  });
});

router.put('/me', async (req, res) => {
  const session = await authenticatedSupabaseSession(req, res, 'account information');
  if (!session) return;

  const allowedFields = new Set(['username', 'zipCode', 'phone']);
  const submittedFields = Object.keys(req.body || {});
  if (!submittedFields.length || submittedFields.some((field) => !allowedFields.has(field))) {
    return res.status(400).json({ error: 'Submit one or more supported account fields.' });
  }

  const inputErrors = [];
  for (const field of submittedFields) {
    if (typeof req.body[field] !== 'string') {
      inputErrors.push({ field, message: `Enter a valid ${field === 'zipCode' ? 'ZIP code' : field === 'phone' ? 'phone number' : 'username'}.` });
    }
  }
  if (inputErrors.length) {
    return res.status(400).json({ errors: inputErrors });
  }

  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const zipCode = typeof req.body.zipCode === 'string' ? req.body.zipCode.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';

  const profileUpdates = {};
  if (submittedFields.includes('username')) profileUpdates.username = username;
  if (submittedFields.includes('zipCode')) profileUpdates.home_zip = zipCode;
  if (submittedFields.includes('phone')) profileUpdates.phone_number = phone || null;

  try {
    const { data, error } = await userDatabase(session.accessToken)
      .from('profiles')
      .update(profileUpdates)
      .eq('id', session.user.id)
      .select('username, home_zip, phone_number')
      .maybeSingle();

    if (error) {
      if (error.code === '23505' && submittedFields.includes('username')) {
        return res.status(400).json({
          errors: [{ field: 'username', message: 'That username is already in use.' }],
        });
      }
      if (databaseValidationErrors.has(error.code)) {
        let policy;
        try {
          const result = await supabase.rpc('get_signup_policy');
          if (result.error) throw result.error;
          policy = result.data;
        } catch (policyError) {
          console.error('Could not retrieve profile validation messages from Supabase:', policyError);
        }

        const message = error.message || '';
        const field = submittedFields.find((submittedField) => (
          submittedField === 'username' && message === policy?.username?.description
        ) || (
          submittedField === 'zipCode' && message === policy?.zipCode?.description
        ));
        const fields = field ? [field] : submittedFields.filter((submittedField) => (
          submittedField === 'username' || submittedField === 'zipCode'
        ));
        if (fields.length) {
          return res.status(400).json({
            errors: fields.map((invalidField) => ({
              field: invalidField,
              message: invalidField === 'username'
                ? policy?.username?.description || 'Username does not meet the account requirements.'
                : policy?.zipCode?.description || 'ZIP code does not meet the account requirements.',
            })),
          });
        }
      }
      console.error('Could not update the Supabase profile:', error);
      return res.status(502).json({ error: 'Your account information could not be saved. Please try again.' });
    }
    if (!data) {
      return res.status(404).json({ error: 'Your account profile could not be found.' });
    }

    return res.json({
      profile: {
        username: data.username,
        zipCode: data.home_zip,
        phone: data.phone_number || '',
      },
    });
  } catch (requestError) {
    console.error('Could not update the Supabase profile:', requestError);
    return res.status(502).json({ error: 'Your account information could not be saved. Please try again.' });
  }
});

router.put('/me/preferences', async (req, res) => {
  const session = await authenticatedSupabaseSession(req, res, 'account preferences');
  if (!session) return;

  const preferences = req.body?.preferences;
  const allowedFields = new Set([
    'budget',
    'goal',
    'excludedAllergens',
    'limitRecommendations',
    'radiusMiles',
  ]);
  const submittedFields = preferences && typeof preferences === 'object' && !Array.isArray(preferences)
    ? Object.keys(preferences)
    : [];
  if (
    submittedFields.length !== allowedFields.size ||
    submittedFields.some((field) => !allowedFields.has(field))
  ) {
    return res.status(400).json({ error: 'Submit all supported preference fields.' });
  }

  const errors = [];
  const budget = preferences.budget;
  if (budget !== null && (typeof budget !== 'number' || !Number.isFinite(budget))) {
    errors.push({ field: 'budget', message: 'Enter a numeric budget or leave it blank.' });
  }

  const goal = preferences.goal;
  if (typeof goal !== 'string') {
    errors.push({ field: 'goal', message: 'Choose a recommendation goal from the available options.' });
  }

  const selectedRestrictions = preferences.excludedAllergens;
  if (!Array.isArray(selectedRestrictions) || selectedRestrictions.some((option) => typeof option !== 'string')) {
    errors.push({ field: 'excludedAllergens', message: 'Choose dietary restrictions from the available options.' });
  }
  const limitRecommendations = preferences.limitRecommendations;
  if (typeof limitRecommendations !== 'boolean') {
    errors.push({ field: 'limitRecommendations', message: 'Choose whether to limit recommendations by distance.' });
  }
  const radiusValue = preferences.radiusMiles;
  if (radiusValue !== 'infinity' && typeof radiusValue !== 'string') {
    errors.push({ field: 'radiusMiles', message: 'Enter a numeric radius or choose any distance.' });
  }
  const radiusMiles = typeof radiusValue === 'string' && radiusValue !== 'infinity'
    ? Number(radiusValue)
    : null;
  if (radiusValue !== 'infinity' && typeof radiusValue === 'string' && !Number.isFinite(radiusMiles)) {
    errors.push({ field: 'radiusMiles', message: 'Enter a numeric radius or choose any distance.' });
  }
  if (errors.length) return res.status(400).json({ errors });

  try {
    const { data, error } = await userDatabase(session.accessToken)
      .from('profiles')
      .update({
        recommendation_budget: budget,
        recommendation_goal: goal,
        excluded_allergens: selectedRestrictions,
        limit_recommendations: limitRecommendations,
        recommendation_radius_miles: radiusMiles,
      })
      .eq('id', session.user.id)
      .select('recommendation_budget, recommendation_goal, excluded_allergens, limit_recommendations, recommendation_radius_miles')
      .maybeSingle();
    if (error) {
      if (databaseValidationErrors.has(error.code)) {
        const field = preferenceValidationField(error);
        if (field) {
          return res.status(400).json({
            errors: [{ field, message: 'This value is not allowed by the account preferences settings.' }],
          });
        }
        return res.status(400).json({
          error: 'One or more preference values are not allowed by the account preferences settings.',
        });
      }
      if (error.code === '23505') {
        return res.status(400).json({ errors: [{ field: 'excludedAllergens', message: 'Remove duplicate dietary restrictions.' }] });
      }
      console.error('Could not update Supabase account preferences:', error);
      return res.status(502).json({ error: 'Your preferences could not be saved. Please try again.' });
    }
    if (!data) return res.status(404).json({ error: 'Your account profile could not be found.' });

    return res.json({
      recommendationPreferences: {
        budget: data.recommendation_budget,
        goal: data.recommendation_goal,
        excludedAllergens: data.excluded_allergens,
        limitRecommendations: data.limit_recommendations,
        radiusMiles: data.recommendation_radius_miles == null ? 'infinity' : String(data.recommendation_radius_miles),
      },
    });
  } catch (requestError) {
    console.error('Could not update Supabase account preferences:', requestError);
    return res.status(502).json({ error: 'Your preferences could not be saved. Please try again.' });
  }
});

router.post('/register', async (req, res) => {
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const textUpdates = req.body?.textUpdates === true;

  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.signUp({
      email: req.body?.email,
      password: req.body?.password,
      emailRedirectTo: 'http://localhost:5173/email-verified',
      options: {
        data: {
          bitewise_signup: true,
          username: req.body?.username,
          zipCode: req.body?.zipCode,
          home_zip: req.body?.zipCode,
          phone,
          textUpdates,
          limitRecommendations: false,
          radiusMiles: '10',
        },
      },
    }));
  } catch (requestError) {
    console.error('Could not register with Supabase:', requestError);
    const details = requestError?.message ? ` Details: ${requestError.message}` : '';
    return res.status(502).json({
      error: `Could not reach Supabase Auth. Check the server connection and try again.${details}`,
    });
  }

  if (error) {
    try {
      const currentValidationErrors = await validateSignupProfile(req.body?.username, req.body?.zipCode);
      if (currentValidationErrors.length) {
        const isAuthClientError = error.status >= 400 && error.status < 500;
        return res.status(isAuthClientError ? error.status : 422).json({
          ...(isAuthClientError ? { authError: error.message } : {}),
          ...(isAuthClientError && error.code ? { authErrorCode: error.code } : {}),
          errors: currentValidationErrors,
        });
      }
    } catch (validationError) {
      console.error('Could not revalidate signup profile with Supabase:', validationError);
    }

    if (error.status >= 400 && error.status < 500) {
      return res.status(error.status).json({
        error: error.message,
        ...(error.code ? { authErrorCode: error.code } : {}),
      });
    }

    console.error('Could not register with Supabase:', error);
    return res.status(502).json({
      error: error.message || 'Supabase Auth could not complete registration. Check the Supabase Auth logs and email settings.',
    });
  }

  const session = data?.session;
  if (!session?.access_token || !Number.isFinite(session.expires_in) || session.expires_in <= 0) {
    return res.status(201).json({
      ok: true,
      authenticated: false,
      message: 'Signup did not sign you in. If this email is eligible for registration, check your inbox and spam folder for a confirmation link. If you already have an account, log in instead.',
    });
  }

  res.cookie('bitewise_session', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in * 1000,
  });
  return res.status(201).json({ ok: true, authenticated: true });
});

router.post('/login', async (req, res) => {
  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.signInWithPassword({
      email: req.body?.email,
      password: req.body?.password,
    }));
  } catch (requestError) {
    console.error('Could not sign in with Supabase:', requestError);
    return res.status(502).json({ error: 'Login could not be completed. Please try again.' });
  }

  if (error) {
    if (error.code === 'email_not_confirmed') {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }
    if (error.status === 400 || error.status === 401) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    console.error('Could not sign in with Supabase:', error);
    return res.status(502).json({ error: 'Login could not be completed. Please try again.' });
  }

  const session = data?.session;
  if (!session?.access_token || !Number.isFinite(session.expires_in) || session.expires_in <= 0) {
    console.error('Supabase sign-in did not return a usable session.');
    return res.status(502).json({ error: 'Login could not be completed. Please try again.' });
  }

  res.cookie('bitewise_session', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in * 1000,
  });
  return res.json({ ok: true });
});

router.post('/logout', async (req, res) => {
  // Clear cookie easily
  res.clearCookie('bitewise_session');
  res.json({ ok: true });
});

export default router;
