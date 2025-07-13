import { memo } from 'react';

export function FilterPills({
  typeTerms,
  capTerms,
  typeFilter,
  capFilter,
  setTypeFilter,
  setCapFilter,
  prettify,
  attrType,
  attrCap,
}) {
  if (!typeTerms.length && !capTerms.length) return null;

  return (
    <div className="filter-pills">
      {attrType && typeTerms.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#999', marginRight: 8 }}>
            Type:
          </span>
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
                cursor: 'pointer',
              }}
              aria-pressed={t === typeFilter}
            >
              {prettify(t)}
            </button>
          ))}
        </div>
      )}

      {attrCap && capTerms.length > 1 && (
        <div style={{ marginBottom: 18 }}>
          <span style={{ fontSize: 12, color: '#999', marginRight: 8 }}>
            Capacity:
          </span>
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
                cursor: 'pointer',
              }}
              aria-pressed={c === capFilter}
            >
              {prettify(c)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}