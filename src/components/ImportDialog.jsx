import { useEffect, useRef } from 'react';

export default function ImportDialog({ open, onClose, onSubmit, error }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          onSubmit(form.restaurantName.value, form.menuText.value);
        }}
      >
        <div className="dialoghead">
          <div>
            <div className="eyebrow">YOUR MENU, YOUR PRICES</div>
            <h2>Analyze a menu</h2>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p>
          Paste menu rows in the format below. We’ll read them and calculate value instantly. This tool doesn’t fetch
          restaurant websites.
        </p>
        <label htmlFor="restaurantName">Restaurant name</label>
        <input id="restaurantName" name="restaurantName" maxLength={60} required placeholder="e.g. Campus Grill" />
        <label htmlFor="menuText">One item per line: name | price | calories | protein (g)</label>
        <textarea
          id="menuText"
          name="menuText"
          required
          rows={7}
          placeholder={'Chicken sandwich | 5.49 | 460 | 28\nSmall fries | 2.29 | 300 | 4'}
        />
        <p className="fine">
          Use a period for decimals. Supply all four fields; unknown nutrition won’t be guessed. Imported menus last
          until you reload this page.
        </p>
        <div id="importError" role="alert">
          {error}
        </div>
        <button className="primary" type="submit">
          Analyze & compare →
        </button>
      </form>
    </dialog>
  );
}
