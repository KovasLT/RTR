import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';
import { useLanes, useRanks, useRegions, useHeroes } from '../../hooks/useReferenceData.js';
import { APP_CONSTANTS } from '../../app-constants';

const A = APP_CONSTANTS.ADMIN;

/**
 * A generic add/list/delete editor for one reference table.
 * `query` is the reference-data hook for the table (called once, unconditionally).
 */
const RefSection = ({ table, title, query, columns, label }) => {
  const qc = useQueryClient();
  const { data: rows = [] } = query();
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: [table] });

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {};
      for (const c of columns) {
        let v = form[c.key] ?? '';
        if (c.type === 'number') v = v === '' ? null : Number(v);
        payload[c.key] = v;
      }
      const { error: err } = await supabase.from(table).insert(payload);
      if (err) throw err;
      setForm({});
      invalidate();
    } catch (e) {
      setError(e.message || A.ERROR);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setError(null);
    const { error: err } = await supabase.from(table).delete().eq('id', id);
    if (err) setError(err.message);
    else invalidate();
  };

  return (
    <div className="rtr-card">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>

      <div className="flex flex-wrap gap-2 mb-3">
        {columns.map((c) => (
          <input
            key={c.key}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            placeholder={c.placeholder}
            type={c.type || 'text'}
            value={form[c.key] ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
          />
        ))}
        <button
          onClick={add}
          disabled={busy}
          className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1 disabled:opacity-50"
        >
          {busy ? A.SAVING : A.REF_ADD}
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <span key={r.id} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 flex items-center gap-2">
            {label(r)}
            <button onClick={() => remove(r.id)} className="text-gray-500 hover:text-red-400" title={A.REF_DELETE}>
              <i className="fas fa-times"></i>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

const AdminReference = () => (
  <div className="space-y-4">
    <RefSection
      table="lanes"
      title={A.REF_LANES}
      query={useLanes}
      columns={[{ key: 'name', placeholder: A.REF_NAME_PLACEHOLDER }, { key: 'sort', placeholder: 'Sort', type: 'number' }]}
      label={(r) => r.name}
    />
    <RefSection
      table="ranks"
      title={A.REF_RANKS}
      query={useRanks}
      columns={[{ key: 'name', placeholder: A.REF_NAME_PLACEHOLDER }, { key: 'tier_order', placeholder: 'Tier', type: 'number' }]}
      label={(r) => r.name}
    />
    <RefSection
      table="regions"
      title={A.REF_REGIONS}
      query={useRegions}
      columns={[
        { key: 'code', placeholder: A.REF_CODE_PLACEHOLDER },
        { key: 'name', placeholder: A.REF_NAME_PLACEHOLDER },
        { key: 'sort', placeholder: 'Sort', type: 'number' },
      ]}
      label={(r) => `${r.code} · ${r.name}`}
    />
    <RefSection
      table="heroes"
      title={A.REF_HEROES}
      query={useHeroes}
      columns={[{ key: 'name', placeholder: A.REF_NAME_PLACEHOLDER }]}
      label={(r) => r.name}
    />
  </div>
);

export default AdminReference;
