'use client';

import { useState, useMemo } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Rechercher...',
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = data;
    if (search && searchKey) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(q)
      );
    }
    if (sortCol) {
      result = [...result].sort((a, b) => {
        const aVal = String(a[sortCol] ?? '');
        const bVal = String(b[sortCol] ?? '');
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, searchKey, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  };

  return (
    <div>
      {searchKey && (
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full max-w-md pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>
        </div>
      )}

      <div
        className="overflow-x-auto rounded-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'rgba(13, 27, 42, 0.8)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-left font-medium text-sm ${
                    col.sortable ? 'cursor-pointer select-none' : ''
                  }`}
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortCol === col.key && (
                      <span style={{ color: '#22c55e' }}>
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((item, idx) => (
              <tr
                key={idx}
                className="transition-colors"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.02)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm">
                    {col.render
                      ? col.render(item)
                      : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Aucun resultat trouve.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>
            {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} sur {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-30"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Precedent
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = page < 3 ? i : page - 2 + i;
              if (pageNum >= totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className="w-8 h-8 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: page === pageNum ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                    color: page === pageNum ? '#22c55e' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-30"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
