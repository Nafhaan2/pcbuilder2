import { useState, useRef, useLayoutEffect } from 'react';
import ChooserGrid from './ChooserGrid';
import { COMPONENTS } from '../constants';
import '../styles/accordion.css';

export default function BuilderTable({
  selected,
  catalog,
  activeKey,
  setActiveKey,
  onSelect,
  total,
  onAddToCart,      // ← new prop supplied by App.jsx
}) {
  const bodiesRef = useRef({});
  const [errorMsg, setErrorMsg] = useState('');

  /* ------------ header ---------------- */
  const Header = ({ comp, open }) => {
    const sel      = selected[comp.key];
    const isMulti  = comp.multi === true;
    const hasSel   = isMulti ? Array.isArray(sel) && sel.length : !!sel;
    const firstSel = isMulti ? sel?.[0] : sel;

    const summary =
      isMulti && Array.isArray(sel)
        ? sel.map((p) => p.name.split(' ')[0]).join(', ')
        : sel?.name;

    return (
      <div
        className={`pcb-acc-header ${open ? 'open' : ''}`}
        onClick={() => setActiveKey(open ? null : comp.key)}
      >
        {firstSel?.images?.[0]?.src && (
          <img className="pcb-acc-thumb" src={firstSel.images[0].src} alt="" />
        )}

        <div className="pcb-acc-meta">
          <div className="label">{comp.label}</div>
          <div className="sel-name">{hasSel ? summary : 'None selected'}</div>
        </div>

        {!isMulti && (
          <div
            className="pcb-acc-price"
            dangerouslySetInnerHTML={{ __html: sel ? sel.price_html : '' }}
          />
        )}

        <span className="pcb-acc-chevron">▼</span>
      </div>
    );
  };

  /* ------------ rows + slide ------------ */
  return (
    <>
      {/* error banner */}
      {errorMsg && (
        <div
          style={{
            background: '#5c0000',
            color: '#fff',
            padding: '8px 22px',
            marginBottom: 8,
            borderRadius: 4,
          }}
        >
          {errorMsg}
        </div>
      )}

      {COMPONENTS.map((c) => {
        const open = activeKey === c.key;

        useLayoutEffect(() => {
          const el = bodiesRef.current[c.key];
          if (!el || !open) return;

          el.style.maxHeight = el.scrollHeight + 'px';
          const unlock = () => {
            el.style.maxHeight = 'none';
            el.removeEventListener('transitionend', unlock);
          };
          el.addEventListener('transitionend', unlock);
        }, [open, c.key]);

        return (
          <div key={c.key}>
            <Header comp={c} open={open} />

            <div
              ref={(el) => (bodiesRef.current[c.key] = el)}
              className="pcb-acc-body"
              style={{ maxHeight: open ? 0 : 0 }}
            >
              {open && (
                <ChooserGrid
                  compKey={c.key}
                  catalog={catalog}
                  selected={selected}
                  onSelect={onSelect}
                  onClose={() => setActiveKey(null)}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* subtotal bar */}
      <div
        style={{
          background: '#3a3a3a',
          color: '#fff',
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: 18,
          fontWeight: 700,
          borderTop: '2px solid #555',
        }}
      >
        Subtotal&nbsp;&nbsp;{total}
      </div>

      {/* add-to-cart bar */}
      <div
        style={{
          background: '#2b2b2b',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '2px solid #555',
          position: 'sticky',
          bottom: 0,
          zIndex: 5,
        }}
      >
        <button
          onClick={() => {
            setErrorMsg('');           // clear previous
            onAddToCart(setErrorMsg);  // App.jsx will perform the API calls
          }}
          style={{
            background: '#28a745',
            color: '#fff',
            padding: '10px 26px',
            fontSize: 16,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Add Build to Cart
        </button>
      </div>
    </>
  );
}
