import { useState, useRef, useEffect } from 'react';
import { winnerMetric, money } from '../lib/value.js';
import './RecWidget.css';

export default function RecWidget({ order, goal, goalLabel }) {
  const [open, setOpen] = useState(true);
  const [pos, setPos] = useState(null); // null = default bottom-right corner
  const widgetRef = useRef(null);
  const drag = useRef(null);

  function startDrag(e) {
    const box = widgetRef.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - box.left, dy: e.clientY - box.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moveDrag(e) {
    if (!drag.current) return;
    const box = widgetRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - drag.current.dx), window.innerWidth - box.width);
    const y = Math.min(Math.max(0, e.clientY - drag.current.dy), window.innerHeight - box.height);
    setPos({ x, y });
  }

  function endDrag() {
    drag.current = null;
  }

  // If the widget sits near the bottom and gets expanded, keep it on screen
  useEffect(() => {
    if (!pos || !widgetRef.current) return;
    const box = widgetRef.current.getBoundingClientRect();
    const maxY = window.innerHeight - box.height;
    if (pos.y > maxY) setPos({ ...pos, y: Math.max(0, maxY) });
  }, [open]);

  if (!order) return null;
  const metric = winnerMetric(order, goal);

  return (
    <aside
      ref={widgetRef}
      className="rec-widget"
      style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
      aria-label="Recommended order"
    >
      <div className="rec-head">
        <span
          className="rec-grip"
          title="Drag to move"
          aria-hidden="true"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          ⋮⋮
        </span>
        <button type="button" className="rec-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span>✦ {goalLabel}</span>
          <span>{open ? '–' : '+'}</span>
        </button>
      </div>
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