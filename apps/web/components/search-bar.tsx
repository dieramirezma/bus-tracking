"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { TrunkRoute, TrunkRouteMap } from "@bus/shared";
import { useLang, type Lang } from "@/lib/i18n";
import { displayName, fold } from "@/lib/transit";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  routes: TrunkRouteMap;
  busCount: Map<string, number>;
  selectedRoute: TrunkRoute | null;
  onSelect: (routeId: string | null) => void;
  className?: string;
}

const MAX_RESULTS = 8;

export function SearchBar({ routes, busCount, selectedRoute, onSelect, className }: SearchBarProps) {
  const { t } = useLang();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Al elegir una ruta (desde aquí, el mapa o la lista) el campo muestra su código.
  useEffect(() => {
    setQuery(selectedRoute ? selectedRoute.shortName : "");
  }, [selectedRoute]);

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q || (selectedRoute && query === selectedRoute.shortName)) return [];
    const scored: { route: TrunkRoute; score: number }[] = [];
    for (const route of Object.values(routes)) {
      const code = fold(route.shortName);
      const name = fold(route.longName);
      let score = -1;
      if (code === q) score = 3;
      else if (code.startsWith(q)) score = 2;
      else if (name.includes(q) || code.includes(q)) score = 1;
      if (score >= 0) scored.push({ route, score });
    }
    return scored
      .sort(
        (a, b) =>
          b.score - a.score ||
          (busCount.get(b.route.id) ?? 0) - (busCount.get(a.route.id) ?? 0) ||
          a.route.shortName.localeCompare(b.route.shortName, "es", { numeric: true }),
      )
      .slice(0, MAX_RESULTS)
      .map((r) => r.route);
  }, [query, routes, busCount, selectedRoute]);

  useEffect(() => setActive(0), [query]);

  const choose = (route: TrunkRoute) => {
    onSelect(route.id);
    setOpen(false);
    inputRef.current?.blur();
  };

  const clear = () => {
    setQuery("");
    onSelect(null);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && query.trim().length > 0 && !(selectedRoute && query === selectedRoute.shortName);

  return (
    <div className={cn("text-porcelain", className)}>
      <div className="bg-enamel border-enamel-line enamel-plate flex h-12 items-center gap-2 rounded-[4px] border pr-1.5 pl-3">
        <Search aria-hidden className="text-slateink size-[18px] shrink-0" strokeWidth={1.75} />
        <label htmlFor={`${listId}-input`} className="sr-only">
          {t.searchLabel}
        </label>
        <input
          id={`${listId}-input`}
          ref={inputRef}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={t.searchPlaceholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="placeholder:text-slateink min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label={t.clearSearch}
            className="text-slateink hover:text-porcelain grid size-9 place-items-center rounded-[3px] transition-colors"
          >
            <X className="size-[18px]" strokeWidth={1.75} />
          </button>
        )}
        <LangToggle />
      </div>

      {showList && (
        <ul
          id={`${listId}-list`}
          role="listbox"
          className="bg-enamel border-enamel-line enamel-scroll mt-1 max-h-[52dvh] overflow-auto rounded-[4px] border py-1"
        >
          {results.length === 0 ? (
            <li className="text-slateink px-3 py-3 text-[15px]">{t.noMatch(query.trim())}</li>
          ) : (
            results.map((route, i) => {
              const n = busCount.get(route.id) ?? 0;
              return (
                <li
                  key={route.id}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(route)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "grid cursor-pointer grid-cols-[4.5rem_1fr_auto] items-baseline gap-3 px-3 py-2.5",
                    i === active && "bg-enamel-raised",
                  )}
                >
                  <span className="font-condensed text-[18px] font-semibold tracking-wide">
                    {route.shortName}
                  </span>
                  <span className="truncate text-[15px]">{displayName(route.longName)}</span>
                  <span className="tabular text-slateink text-[13px]">{n > 0 ? t.busesShort(n) : "—"}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

function LangToggle() {
  const { lang, setLang, t } = useLang();
  const options: Lang[] = ["es", "en"];
  return (
    <div
      role="group"
      aria-label={t.langLabel}
      className="border-enamel-line flex h-9 shrink-0 rounded-[3px] border"
    >
      {options.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            "font-condensed w-9 text-[13px] font-semibold tracking-wider uppercase transition-colors",
            lang === l ? "bg-porcelain text-enamel" : "text-slateink hover:text-porcelain",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
