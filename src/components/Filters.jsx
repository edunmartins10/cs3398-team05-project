export default function Filters({
  budget,
  onBudgetChange,
  goal,
  onGoalChange,
  minimum,
  onMinimumChange,
  restaurants,
  itemCounts,
  selected,
  onToggleRestaurant,
  combos,
  onCombosChange,
  onReset,
}) {
  return (
    <aside>
      <div className="section-number">01 / YOUR ORDER</div>
      <h2>What’s the budget?</h2>
      <div className="budgetrow">
        <span>Up to</span>
        <label className="budgetinput">
          $
          <input
            type="number"
            min="1"
            max="100"
            step="0.5"
            value={budget}
            aria-label="Budget in dollars"
            onChange={(e) => onBudgetChange(e.target.value)}
          />
        </label>
      </div>
      <input
        type="range"
        min="1"
        max="30"
        step="0.5"
        value={Math.min(30, Number(budget) || 1)}
        aria-label="Budget slider"
        onChange={(e) => onBudgetChange(e.target.value)}
      />
      <div className="range-label">
        <span>$1</span>
        <span>$30</span>
      </div>
      <label className="control-title" htmlFor="goal">
        What matters most?
      </label>
      <select id="goal" value={goal} onChange={(e) => onGoalChange(e.target.value)}>
        <option value="balanced">Balanced value</option>
        <option value="protein">Protein per dollar</option>
        <option value="calories">Calories per dollar</option>
        <option value="price">Lowest price</option>
      </select>
      <label className="control-title" htmlFor="minimum">
        Minimum calories
      </label>
      <select id="minimum" value={minimum} onChange={(e) => onMinimumChange(e.target.value)}>
        <option value="0">Any size</option>
        <option value="400">400 — A light meal</option>
        <option value="600">600 — A full meal</option>
        <option value="800">800 — A bigger meal</option>
      </select>
      <fieldset>
        <legend className="control-title">Restaurants</legend>
        <div id="restaurants">
          {restaurants.map((name) => (
            <label className="check" key={name}>
              <input
                type="checkbox"
                checked={selected.has(name)}
                onChange={(e) => onToggleRestaurant(name, e.target.checked)}
              />
              <span>{name}</span>
              <b>{itemCounts[name]}</b>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="toggle">
        <input type="checkbox" checked={combos} onChange={(e) => onCombosChange(e.target.checked)} />
        <span>
          Find two-item combinations
          <small>Within the same restaurant</small>
        </span>
      </label>
      <button type="button" className="reset" onClick={onReset}>
        Reset filters
      </button>
      <p className="fine">Totals are before tax, fees, and tips. Availability and portions vary by location.</p>
    </aside>
  );
}
