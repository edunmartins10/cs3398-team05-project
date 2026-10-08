import { useEffect, useRef, useState } from 'react';
import { postJson } from '../lib/api.js';

export default function DonationDialog({ open, onClose, onError }) {
  const ref = useRef(null);
  const [amount, setAmount] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars < 1 || dollars > 500) {
      setError('Choose an amount between $1 and $500.'); setBusy(false); return;
    }
    try {
      const { checkoutUrl } = await postJson('/api/donations/checkout', { amountCents: Math.round(dollars * 100) });
      window.location.assign(checkoutUrl);
    } catch (err) { setError(err.message); onError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <dialog ref={ref} className="donation-dialog" onClose={onClose} onCancel={onClose}>
      <form onSubmit={submit}>
        <div className="dialoghead"><div><div className="eyebrow">KEEP BITEWISE COOKING</div><h2>Leave a tip</h2></div><button type="button" className="close" onClick={onClose} aria-label="Close">×</button></div>
        <p>Like the project? Make a one-time contribution to help support Bitewise.</p>
        <div className="donation-amounts" aria-label="Choose a donation amount">
          {['3', '5', '10', '20'].map((value) => <button type="button" key={value} className={amount === value ? 'chosen' : ''} onClick={() => setAmount(value)}>${value}</button>)}
        </div>
        <label htmlFor="donationAmount">Or enter an amount (USD)</label>
        <div className="money-field"><span>$</span><input id="donationAmount" type="number" min="1" max="500" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
        <p className="fine">Payment is handled by Stripe Checkout. Bitewise never sees or stores your card number. This is a one-time donation.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Opening secure checkout…' : `Continue to secure checkout →`}</button>
      </form>
    </dialog>
  );
}
