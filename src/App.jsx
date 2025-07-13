import { useEffect, useState } from 'react';
import { COMPONENTS } from './constants';
import BuilderTable from './components/BuilderTable';
import './styles/cards.css';

export default function App() {
  /* ---------------------------------------------------------------- state */
  const [activeKey, setActiveKey] = useState(null);
  const [catalog,   setCatalog]   = useState({});
  const [selected,  setSelected]  = useState({});
  const [error,     setError]     = useState('');

  /* --------------------------------------------------- lazy-load categories */
  useEffect(() => {
    if (!activeKey) return;
    const comp = COMPONENTS.find((c) => c.key === activeKey);
    if (!comp || Array.isArray(comp.slug)) return;
    const slug = comp.slug;
    if (catalog[slug]) return;

    (async () => {
      try {
        const res  = await fetch(
          `${window.pcBuilderData.root}pcbuilder/v1/products?category=${slug}&per_page=100`,
          { headers: { 'X-WP-Nonce': window.pcBuilderData.nonce } }
        );
        const json = await res.json();
        setCatalog((prev) => ({ ...prev, [slug]: json.body || [] }));
      } catch (e) {
        console.error(e);
        setError('Could not load products.');
      }
    })();
  }, [activeKey, catalog]);

  /* --------------------------------------------------- handle selections */
  function handleSelect(kind, payload) {
    if (kind === '_cache') {
      setCatalog((prev) => ({ ...prev, ...payload }));
      return;
    }
    const comp = COMPONENTS.find((c) => c.key === kind);
    if (comp?.multi) {
      setSelected((prev) => {
        const prevArr = Array.isArray(prev[kind]) ? prev[kind] : [];
        const exists  = prevArr.some((p) => p.id === payload.id);
        const nextArr = exists
          ? prevArr.filter((p) => p.id !== payload.id)
          : [...prevArr, payload];
        return { ...prev, [kind]: nextArr };
      });
    } else {
      setSelected((prev) => ({ ...prev, [kind]: payload }));
    }
  }

  /* ------------------------------------------------ subtotal display */
  const total = Object.values(selected)
    .reduce((sum, item) => (
      Array.isArray(item)
        ? sum + item.reduce((s, p) => s + Number(p.price || 0), 0)
        : sum + Number(item.price || 0)
    ), 0)
    .toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  /* ------------------------------------------------ add build to cart */
  async function handleAddToCart(setErr) {
    try {
      /* flatten selections into [{ id, quantity:1 }] (no duplicates aggregated) */
      const items = [];
      Object.values(selected).forEach((val) => {
        if (!val) return;
        (Array.isArray(val) ? val : [val]).forEach((p) =>
          items.push({ id: p.id, quantity: 1 })
        );
      });

      if (!items.length) {
        setErr('Please pick at least one component.'); return;
      }

      /* ---------- 1) batch route (Woo ≥ 6.9) ---------- */
      const tryBatch = async (path) => {
        const res = await fetch(path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WC-Store-API-Nonce': window.pcBuilderData.storeNonce,
          },
          credentials: 'include',
          body: JSON.stringify({ items }),
        });
        return res;
      };

      let res = await tryBatch('/wp-json/wc/store/v1/cart/add-items');
      if (res.ok) { window.location.href = window.pcBuilderData.cartUrl; return; }
      if (res.status !== 404) {
        const { message } = await res.json();
        throw new Error(message || 'Store API batch error');
      }

      /* ---------- 2) older batch route (no /v1) ------- */
      res = await tryBatch('/wp-json/wc/store/cart/add-items');
      if (res.ok) { window.location.href = window.pcBuilderData.cartUrl; return; }
      if (res.status !== 404) {
        const { message } = await res.json();
        throw new Error(message || 'Store API batch error');
      }

      /* ---------- 3) add items one-by-one ------------ */
      const failed = [];
      for (const it of items) {
        const r = await fetch('/wp-json/wc/store/cart/add-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WC-Store-API-Nonce': window.pcBuilderData.storeNonce,
          },
          credentials: 'include',
          body: JSON.stringify(it),
        });
        if (!r.ok) {
          failed.push(it.id);
          /* continue adding the rest so cart is as complete as possible */
        }
      }
      if (failed.length === 0) {
        window.location.href = window.pcBuilderData.cartUrl; return;
      }

      /* ---------- 4) if add-item route missing (404) — classical GET */
      if (failed.length === items.length) {
        const qs = items.map(({ id }) => id).join('&add-to-cart=');
        window.location.href =
          `${window.pcBuilderData.cartUrl}?add-to-cart=${qs}`;
        return;
      }

      /* some items failed, some succeeded */
      const msg = `Warning: ${failed.length} item(s) could not be added (possible stock or "sold individually" limits).`;
      setErr(msg);
      window.location.href = window.pcBuilderData.cartUrl;

    } catch (e) {
      console.error(e);
      setErr(e.message || 'Could not add items to cart.');
    }
  }

  /* ------------------------------------------------ render */
  return (
    <div style={{ padding: '40px 5vw', maxWidth: 1600, margin: '0 auto' }}>
      {error && <p style={{ color: 'tomato', marginBottom: 8 }}>{error}</p>}

      <BuilderTable
        selected={selected}
        catalog={catalog}
        activeKey={activeKey}
        setActiveKey={setActiveKey}
        onSelect={handleSelect}
        total={total}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
