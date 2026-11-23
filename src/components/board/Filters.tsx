"use client";

import { inputClass, secondaryButtonClass } from "@/components/ui/field-styles";
import {
  EMPTY_FILTERS,
  SORT_LABELS,
  isCustomView,
  type Filters as FiltersState,
  type SortKey,
} from "@/lib/filters";

type Options = { cities: string[]; contracts: string[]; sources: string[] };

function FilterSelect({
  id,
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  // Keep a currently selected value selectable even if no card uses it anymore.
  const list = value && !options.includes(value) ? [...options, value] : options;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-muted text-xs font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">{allLabel}</option>
        {list.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Filters({
  filters,
  options,
  onChange,
}: {
  filters: FiltersState;
  options: Options;
  onChange: (next: FiltersState) => void;
}) {
  const set = (patch: Partial<FiltersState>) => onChange({ ...filters, ...patch });
  const custom = isCustomView(filters);

  return (
    <search aria-label="Recherche et filtres" className="mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="filter-query" className="text-muted text-xs font-medium">
            Rechercher
          </label>
          <input
            id="filter-query"
            type="search"
            value={filters.query}
            placeholder="Entreprise, poste, ville…"
            onChange={(e) => set({ query: e.target.value })}
            className={inputClass}
          />
        </div>
        <FilterSelect
          id="filter-city"
          label="Ville"
          allLabel="Toutes"
          value={filters.city}
          options={options.cities}
          onChange={(city) => set({ city })}
        />
        <FilterSelect
          id="filter-contract"
          label="Contrat"
          allLabel="Tous"
          value={filters.contract}
          options={options.contracts}
          onChange={(contract) => set({ contract })}
        />
        <FilterSelect
          id="filter-source"
          label="Source"
          allLabel="Toutes"
          value={filters.source}
          options={options.sources}
          onChange={(source) => set({ source })}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-sort" className="text-muted text-xs font-medium">
            Trier par
          </label>
          <select
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value as SortKey })}
            className={inputClass}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        {custom && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className={secondaryButtonClass}
          >
            Réinitialiser
          </button>
        )}
      </div>
      {custom && (
        <p className="text-muted mt-2 text-xs">
          Le glisser-déposer est désactivé tant qu&apos;un filtre ou un tri est actif.
        </p>
      )}
    </search>
  );
}
