import { useEffect, useRef, useState } from 'react';

const radii = [5, 10, 15, 20, 'infinity'];

export default function AccountDialog({ open, onClose, profile, recommendationPreferences, onSave, onSignOut }) {
  const ref = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);

  async function submit(event) {
    event.preventDefault(); setError(''); setSaved(''); setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await onSave({
        zipCode: form.get('zipCode'), phone: form.get('phone'),
        textUpdates: form.get('textUpdates') === 'on',
        limitRecommendations: form.get('limitRecommendations') === 'on',
        radiusMiles: form.get('radiusMiles'),

recommendationPreferences: {
  budget: Number(form.get('recommendationBudget')),
  goal: form.get('recommendationGoal'),
  excludedAllergens: String(form.get('excludedAllergens') || '')
    .split(',')
    .map(allergen => allergen.trim().toLowerCase())
    .filter(Boolean)
},


      });
      setSaved('Settings saved.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <dialog ref={ref} className="account-dialog" onClose={onClose} onCancel={onClose}>
      <form onSubmit={submit}>
        <div className="dialoghead"><div><div className="eyebrow">ACCOUNT SETTINGS</div><h2>Hi, {profile.username}</h2></div><button type="button" className="close" onClick={onClose} aria-label="Close">×</button></div>
        <p className="profile-email">{profile.email} <span className="verified-label">Email verified</span></p>
        <label htmlFor="profileZip">Home ZIP code</label>
        <input id="profileZip" name="zipCode" inputMode="numeric" autoComplete="postal-code" pattern="\d{5}" maxLength={5} defaultValue={profile.zipCode} required />
        <label htmlFor="profilePhone">Phone number <span className="optional">optional</span></label>
        <input id="profilePhone" name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone || ''} placeholder="(512) 555-0123" />
        <label className="consent"><input type="checkbox" name="textUpdates" defaultChecked={profile.textUpdates} /><span>Opt in to Bitewise text updates. Message and data rates may apply. Reply STOP to opt out.</span></label>
        <section className="radius-settings">
          <div className="eyebrow">RESTAURANT DISTANCE</div>
          <label className="consent radius-toggle"><input type="checkbox" name="limitRecommendations" defaultChecked={profile.limitRecommendations} /><span>Limit recommendations by distance<small>Turn this off to see restaurants at any distance.</small></span></label>
          <label htmlFor="radiusMiles">Recommend restaurants up to</label>
          <select name="radiusMiles" id="radiusMiles" defaultValue={String(profile.radiusMiles ?? 5)}>
            {radii.map((mile) => <option key={mile} value={mile}>{mile === 'infinity' ? 'Any distance' : `${mile} miles`}</option>)}
          </select>
          <p className="fine">Distances use approximate ZIP and sample restaurant locations. Imported menus can include a restaurant ZIP for a distance estimate.</p>
        </section>

        <section className="recommendation-settings">
  <div className="eyebrow">RECOMMENDATION PREFERENCES</div>

  <label htmlFor="recommendationBudget">Meal budget ($)</label>
  <input
    id="recommendationBudget"
    name="recommendationBudget"
    type="number"
    min="0.01"
    max="1000"
    step="0.01"
    defaultValue={recommendationPreferences?.budget ?? 10}
    required
  />

  <label htmlFor="recommendationGoal">Recommendation goal</label>
  <select
    id="recommendationGoal"
    name="recommendationGoal"
    defaultValue={recommendationPreferences?.goal ?? 'value'}
  >
    <option value="value">Best value</option>
    <option value="dietary">Dietary score</option>
    <option value="personalized">Personalized</option>
  </select>

  <label htmlFor="excludedAllergens">
    Excluded allergens (separate with commas)
  </label>
  <input
    id="excludedAllergens"
    name="excludedAllergens"
    type="text"
    placeholder="milk, wheat, peanuts"
    defaultValue={
      recommendationPreferences?.excludedAllergens?.join(', ') ?? ''
    }
  />

  <p className="fine">
    Meals without allergen information will be excluded when you set
    allergen restrictions. Always verify ingredients and cross-contact
    risks with the restaurant.
  </p>
</section>

        {saved && <div className="form-message" role="status">{saved}</div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save account settings →'}</button>
        <button className="reset account-logout" type="button" onClick={onSignOut}>Log out</button>
      </form>
    </dialog>
  );
}
