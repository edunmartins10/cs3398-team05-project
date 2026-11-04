import { useState } from 'react';
import { WINNER_LABELS, winnerMetric, money } from '../lib/value.js';
import './RecWidget.css';

export default function RecWidget({ order, goal }) {
  const [open, setOpen] = useState(true);
  if (!order) return null;
  const metric = winnerMetric(order, goal);
  return (
    <aside className="rec-widget" aria-label="Recommended order">
      <button type="button" className="rec-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>✦ {WINNER_LABELS[goal]}</span>
        <span>{open ? '–' : '+'}</span>
      </button>
      {open && (
        <div className="rec-body">
          <div className="rec-restaurant">{order.restaurant}</div>
          <div className="rec-name">{order.name}</div>
          <div className="rec-metric">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
          <div className="rec-stats">
            {money(order.price)} · {order.calories} cal · {order.protein}g protein
          </div>
        </div>
      )}
    </aside>
  );
}