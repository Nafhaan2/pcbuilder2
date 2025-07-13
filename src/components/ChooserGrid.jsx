import { useEffect, useState, useMemo } from 'react';
import { COMPONENTS } from '../constants';

export default function ChooserGrid({
  compKey,
  catalog,
  selected,
  onSelect,
  onClose,
}) {
  /* ---------- config ---------- */
  const comp = COMPONENTS.find((c) => c.key === compKey);
  const {
    label,
    slug,
    tabNames = [],
    multi = false,
    attrType,
    attrCap,
  } = comp;

  const slugList    = Array.isArray(slug) ? slug : [slug];
  const hasSlugTabs = slugList.length > 1;

  /* ---------- state ----------- */
  const [activeSlugIdx, setActiveSlugIdx] = useState(0);
  const [typeFilter, setTypeFilter]       = useState('');
  const [capFilter,  setCapFilter]        = useState('');
  const [merged,     setMerged]           = useState([]);
  const [loading,    setLoading]          = useState(true);

  /* ---------- fetch & cache ---- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      const all = [];
      for (const s of slugList) {
        if (catalog[s]) { all.push(...catalog[s]); continue; }
        try {
          const res  = await fetch(
            `${window.pcBuilderData.root}pcbuilder/v1/products?category=${s}&per_page=100`,
            { headers: { 'X-WP-Nonce': window.pcBuilderData.nonce } }
          );
          const json = await res.json();
          const arr  = json.body || [];
          onSelect('_cache', { [s]: arr });
          all.push(...arr);
        } catch (err) { console.error(err); }
      }
      if (!cancel) { setMerged(all); setLoading(false); }
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugList.join(','), catalog]);

  /* ---------- attribute term sets ---- */
  const { typeTerms, capTerms } = useMemo(() => {
    const t = new Set(), c = new Set();
    merged.forEach((p) => {
      p.attributes.forEach((a) => {
        if (attrType && (a.slug === attrType || a.slug === `pa_${attrType}`))
          a.options.forEach((o) => t.add(o));
        if (attrCap  && (a.slug === attrCap  || a.slug === `pa_${attrCap}`))
          a.options.forEach((o) => c.add(o));
      });
    });
    return { typeTerms: [...t], capTerms: [...c] };
  }, [merged, attrType, attrCap]);

  useEffect(() => {
    if (!typeTerms.includes(typeFilter)) setTypeFilter('');
    if (!capTerms.includes(capFilter))   setCapFilter('');
  }, [typeTerms, capTerms, typeFilter, capFilter]);

  /* ---------- filter list ---------- */
  const currentSlug = slugList[activeSlugIdx];
  const showList    = merged.filter((p) => {
    const okSlug = hasSlugTabs
      ? p.categories.some((c) => c.slug === currentSlug) : true;
    const okType = typeFilter
      ? p.attributes.some(
          (a) =>
            (a.slug === attrType || a.slug === `pa_${attrType}`) &&
            a.options.includes(typeFilter)
        ) : true;
    const okCap = capFilter
      ? p.attributes.some(
          (a) =>
            (a.slug === attrCap || a.slug === `pa_${attrCap}`) &&
            a.options.includes(capFilter)
        ) : true;
    return okSlug && okType && okCap;
  });

  /* ---------- helpers ------------- */
  const prettify = (s) =>
    s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const chosen = (p) =>
    multi
      ? Array.isArray(selected[compKey]) &&
        selected[compKey].some((d) => d.id === p.id)
      : selected[compKey]?.id === p.id;

  /* ---------- UI ------------------ */
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ marginBottom: 12 }}>Select {label}</h3>

      {/* slug tabs */}
      {hasSlugTabs && (
        <div style={{ marginBottom: 14 }}>
          {slugList.map((raw, i) => (
            <button
              key={raw}
              onClick={() => setActiveSlugIdx(i)}
              style={{
                padding: '6px 18px',
                marginRight: 12,
                borderRadius: 20,
                border: '1px solid #777',
                background: i === activeSlugIdx ? '#ffe24c' : 'transparent',
                color: i === activeSlugIdx ? '#000' : '#fff',
              }}
            >
              {tabNames[i] || prettify(raw)}
            </button>
          ))}
        </div>
      )}

      {/* attribute pills */}
      {attrType && typeTerms.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          {typeTerms.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
              style={{
                padding: '5px 14px',
                marginRight: 10,
                borderRadius: 18,
                border: '1px solid #777',
                background: t === typeFilter ? '#ffe24c' : 'transparent',
                color: t === typeFilter ? '#000' : '#fff',
                fontSize: 13,
              }}
            >
              {prettify(t)}
            </button>
          ))}
        </div>
      )}

      {attrCap && capTerms.length > 1 && (
        <div style={{ marginBottom: 18 }}>
          {capTerms.map((c) => (
            <button
              key={c}
              onClick={() => setCapFilter(c === capFilter ? '' : c)}
              style={{
                padding: '5px 14px',
                marginRight: 10,
                borderRadius: 18,
                border: '1px solid #777',
                background: c === capFilter ? '#ffe24c' : 'transparent',
                color: c === capFilter ? '#000' : '#fff',
                fontSize: 13,
              }}
            >
              {prettify(c)}
            </button>
          ))}
        </div>
      )}

      {loading && <p>Loading…</p>}
      {!loading && showList.length === 0 && <p>No products found.</p>}

      {!!showList.length && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
            gap: 32,
          }}
        >
          {showList.map((p) => {
            const oos = p.stock_status === 'outofstock';
            return (
              <button
                key={p.id}
                className={`pcb-card ${chosen(p) ? 'selected' : ''} ${
                  oos ? 'oos' : ''
                }`}
                disabled={oos}
                onClick={() => {
                  if (oos) return;
                  onSelect(compKey, p);
                  if (!multi) onClose();
                }}
              >
                <img src={p.images?.[0]?.src} alt={p.name} />
                <span className="name">{p.name}</span>
                <span
                  className="price"
                  dangerouslySetInnerHTML={{ __html: p.price_html }}
                />
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onClose}
        style={{ marginTop: 18, padding: '6px 14px', cursor: 'pointer' }}
      >
        Close
      </button>
    </div>
  );
}
