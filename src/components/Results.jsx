import { money, ratioLabel, WINNER_LABELS, winnerMetric } from '../lib/value.js';

function Winner({ order, goal, budgetCents }) {
  const metric = winnerMetric(order, goal);
  return (
    <article className="winner">
      <span className="badge">✦ {WINNER_LABELS[goal]}</span>
      <div className="winner-top">
        <div>
          <div className="restaurant">
            {order.restaurant} · {order.source === 'sample' ? 'Sample menu' : 'Your menu'}
          </div>
          <h3>{order.name}</h3>
        </div>
        <div className="price">
          {money(order.price)}
          <small>{money(budgetCents - order.price)} left over</small>
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <strong>{order.calories}</strong>
          <span>total calories</span>
        </div>
        <div className="metric">
          <strong>{order.protein}g</strong>
          <span>total protein</span>
        </div>
        <div className="metric">
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
      </div>
      <p className="winner-note">
        {Math.round(order.cpd)} calories and {order.ppd.toFixed(1)}g protein for every dollar.{' '}
        {order.source === 'sample'
          ? 'Check local menu prices before ordering.'
          : 'Based on the prices and nutrition you entered.'}
      </p>
    </article>
  );
}

export default function Results({ list, goal, budgetDollars }) {
  const raw = Number(budgetDollars);
  const budgetCents = Number.isFinite(raw) ? Math.max(0, Math.round(raw * 100)) : 0;
  const rest = list.slice(1, 7);

  return (
    <section className="results">
      <div className="results-head">
        <div>
          <div className="section-number">02 / THE SHORTLIST</div>
          <h2>Your money’s worth</h2>
        </div>
        <span>{list.length} matching orders</span>
      </div>
      <div aria-live="polite">
        {!list.length ? (
          <div className="empty">
            <h3>No orders fit just yet.</h3>
            <p>Try a higher budget, a lower calorie minimum, or select another restaurant.</p>
          </div>
        ) : (
          <Winner order={list[0]} goal={goal} budgetCents={budgetCents} />
        )}
      </div>
      {list.length > 0 && (
        <>
          <div className="list-head">
            <h3>Compare your options</h3>
            <span>Ranked for your priorities</span>
          </div>
          <div>
            {rest.map((x, i) => (
              <article className="card" key={`${x.restaurant}-${x.name}-${x.price}-${i}`}>
                <span className="rank">{String(i + 2).padStart(2, '0')}</span>
                <div>
                  <div className="restaurant">
                    {x.restaurant} · {x.source === 'sample' ? 'Sample' : 'Your menu'}
                  </div>
                  <h3>{x.name}</h3>
                  <div className="stats">
                    <span>{x.calories} cal</span>
                    <span>{x.protein}g protein</span>
                    <span className="ratio">{ratioLabel(x, goal)}</span>
                  </div>
                </div>
                <div className="price">{money(x.price)}</div>
              </article>
            ))}
            {list.length > 7 && (
              <p className="fine">
                Showing the top 7 of {list.length} matching orders. Adjust your filters to explore more.
              </p>
            )}
          </div>
        </>
      )}
      <details className="method">
        <summary>How do we measure “value”?</summary>
        <p>
          Balanced value gives equal weight to calories per dollar and protein per dollar, normalized against the best
          eligible order in each category. Protein and calorie modes rank their respective ratios; lowest-price mode
          ranks total cost. Combinations contain at most two menu items from one restaurant, with repeats allowed.
        </p>
        <p>
          Calories are an energy measure, not a measure of portion size, taste, or health. Scores compare only the menu
          items in this tool. Sample nutrition values are illustrative.
        </p>
      </details>
    </section>
  );
}
