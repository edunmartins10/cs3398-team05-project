import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Intro from './components/Intro.jsx';
import Filters from './components/Filters.jsx';
import Results from './components/Results.jsx';
import ImportDialog from './components/ImportDialog.jsx';
import { createSampleMenu } from './data/sampleMenu.js';
import { parseMenu, rankedOrders, restaurantNames } from './lib/value.js';

const DEFAULTS = {
  budget: '10',
  goal: 'balanced',
  minimum: '400',
  combos: true,
};

export default function App() {
  const [menu, setMenu] = useState(createSampleMenu);
  const [selected, setSelected] = useState(() => new Set(createSampleMenu().map((x) => x.restaurant)));
  const [budget, setBudget] = useState(DEFAULTS.budget);
  const [goal, setGoal] = useState(DEFAULTS.goal);
  const [minimum, setMinimum] = useState(DEFAULTS.minimum);
  const [combos, setCombos] = useState(DEFAULTS.combos);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState('');

  const names = useMemo(() => restaurantNames(menu), [menu]);
  const itemCounts = useMemo(() => {
    const counts = {};
    for (const item of menu) counts[item.restaurant] = (counts[item.restaurant] || 0) + 1;
    return counts;
  }, [menu]);

  const list = useMemo(
    () => rankedOrders(menu, selected, budget, minimum, combos, goal),
    [menu, selected, budget, minimum, combos, goal],
  );

  function handleBudgetChange(value) {
    setBudget(value);
  }

  function toggleRestaurant(name, checked) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  }

  function resetFilters() {
    setBudget(DEFAULTS.budget);
    setGoal(DEFAULTS.goal);
    setMinimum(DEFAULTS.minimum);
    setCombos(DEFAULTS.combos);
    setSelected(new Set(menu.map((x) => x.restaurant)));
  }

  function importMenu(restaurantName, menuText) {
    try {
      const name = restaurantName.trim();
      if (!name) throw Error('Enter a restaurant name.');
      const start = menu.length ? Math.max(...menu.map((x) => x.id)) + 1 : 0;
      const custom = parseMenu(menuText, name, start);
      const nextMenu = menu.filter((x) => x.restaurant !== name).concat(custom);
      setMenu(nextMenu);
      setSelected(new Set([name]));
      setMinimum('0');
      setImportError('');
      setImportOpen(false);
    } catch (err) {
      setImportError(err.message);
    }
  }

  return (
    <>
      <Header
        onOpenImport={() => {
          setImportError('');
          setImportOpen(true);
        }}
      />
      <main>
        <Intro />
        <div className="demo">
          <strong>Sample menu mode</strong>
          <span>Illustrative prices and nutrition, not current restaurant offers. Add your own menu for a real comparison.</span>
        </div>
        <div className="workspace">
          <Filters
            budget={budget}
            onBudgetChange={handleBudgetChange}
            goal={goal}
            onGoalChange={setGoal}
            minimum={minimum}
            onMinimumChange={setMinimum}
            restaurants={names}
            itemCounts={itemCounts}
            selected={selected}
            onToggleRestaurant={toggleRestaurant}
            combos={combos}
            onCombosChange={setCombos}
            onReset={resetFilters}
          />
          <Results list={list} goal={goal} budgetDollars={budget} />
        </div>
        <footer>
          <span className="brand footerbrand">bitewise.</span>
          <span>A little math. A better lunch.</span>
          <a href="https://unsplash.com/photos/burger-with-lettuce-and-fries-PxJ9zkM2wdA" target="_blank" rel="noreferrer">
            Photo: Unsplash ↗
          </a>
        </footer>
      </main>
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSubmit={importMenu}
        error={importError}
      />
    </>
  );
}
