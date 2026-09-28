import { useState, useMemo } from "react";
import { sampleMenu, buildMenu, money, buildOrders, rankOrders } from "./data";
import "./App.css";

const menu = buildMenu(sampleMenu);
const allRestaurants = [...new Set(menu.map((x) => x.restaurant))];

function App() {
  const [budget, setBudget] = useState(10);
  const [goal, setGoal] = useState("balanced");
  const [minimum, setMinimum] = useState(400);
  const [combos, setCombos] = useState(true);
  const [selected, setSelected] = useState(new Set(allRestaurants));

  const list = useMemo(() => {
    const budgetCents = Math.round(Number(budget) * 100);
    const items = menu.filter((x) => selected.has(x.restaurant));
    const all = buildOrders(items, budgetCents, Number(minimum), combos);
    return rankOrders(all, goal);
  }, [budget, goal, minimum, combos, selected]);

  function toggleRestaurant(name) {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    setSelected(next);
  }

  function resetFilters() {
    setBudget(10);
    setGoal("balanced");
    setMinimum(400);
    setCombos(true);
    setSelected(new Set(allRestaurants));
  }

  const winner = list[0];

  return (
    <div className="app">
      <header>
        <span className="brand">JOBLAM</span>
        <span className="headernote">Good food. Smarter spending.</span>
      </header>

      <main>
        <div className="workspace">
          <aside>
            <h2>What's the budget?</h2>
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
                  onChange={(e) => setBudget(e.target.value)}
                />
              </label>
            </div>

            <label className="control-title">What matters most?</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value="balanced">Balanced value</option>
              <option value="protein">Protein per dollar</option>
              <option value="calories">Calories per dollar</option>
              <option value="price">Lowest price</option>
            </select>

            <label className="control-title">Minimum calories</label>
            <select value={minimum} onChange={(e) => setMinimum(e.target.value)}>
              <option value="0">Any size</option>
              <option value="400">400 — A light meal</option>
              <option value="600">600 — A full meal</option>
              <option value="800">800 — A bigger meal</option>
            </select>

            <fieldset>
              <legend className="control-title">Restaurants</legend>
              {allRestaurants.map((r) => (
                <label className="check" key={r}>
                  <input
                    type="checkbox"
                    checked={selected.has(r)}
                    onChange={() => toggleRestaurant(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </fieldset>

            <label className="toggle">
              <input
                type="checkbox"
                checked={combos}
                onChange={(e) => setCombos(e.target.checked)}
              />
              <span>Find two-item combinations</span>
            </label>

            <button className="reset" onClick={resetFilters}>
              Reset filters
            </button>
          </aside>

          <section className="results">
            <h2>Your money's worth</h2>
            <span>{list.length} matching orders</span>

            {!winner && (
              <div className="empty">
                <h3>No orders fit just yet.</h3>
                <p>Try a higher budget, a lower calorie minimum, or select another restaurant.</p>
              </div>
            )}

            {winner && (
              <article className="winner">
                <div className="restaurant">{winner.restaurant}</div>
                <h3>{winner.name}</h3>
                <div className="price">{money(winner.price)}</div>
                <div className="metrics">
                  <div>{winner.calories} calories</div>
                  <div>{winner.protein}g protein</div>
                </div>
              </article>
            )}

            <div id="cards">
              {list.slice(1, 7).map((x, i) => (
                <article className="card" key={i}>
                  <span className="rank">{String(i + 2).padStart(2, "0")}</span>
                  <div>
                    <div className="restaurant">{x.restaurant}</div>
                    <h3>{x.name}</h3>
                    <div className="stats">
                      <span>{x.calories} cal</span>
                      <span>{x.protein}g protein</span>
                    </div>
                  </div>
                  <div className="price">{money(x.price)}</div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;