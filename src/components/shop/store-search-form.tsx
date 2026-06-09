"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/catalog";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { addSearchHistory, getSearchHistory } from "@/lib/search-history";
import { formatCurrency } from "@/lib/format";
import {
  Search,
  Loader2,
  Mic,
  MicOff,
  SlidersHorizontal,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppSession } from "@/components/providers/session-provider";

type StoreSearchFormProps = {
  categories: Pick<Category, "slug" | "name">[];
  className?: string;
  variant?: "header" | "panel";
  onNavigate?: () => void;
};

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  imageUrl: string;
  categoryName?: string;
  inStock?: boolean;
};

export function StoreSearchForm({
  categories,
  className,
  variant = "header",
  onNavigate,
}: StoreSearchFormProps) {
  const router = useRouter();
  const { user } = useAppSession();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [listening, setListening] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = "search-suggestions-listbox";

  const debouncedQuery = useDebounce(q, 300);

  const loadHistory = useCallback(() => {
    setHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      if (debouncedQuery.length < 2) setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let isMounted = true;

    async function fetchSuggestions() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: "5",
        });
        if (category) params.set("category", category);
        if (minPrice) params.set("minPrice", String(parseInt(minPrice, 10) * 100));
        if (maxPrice) params.set("maxPrice", String(parseInt(maxPrice, 10) * 100));
        if (inStockOnly) params.set("inStock", "true");

        const res = await fetch(`/api/products/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        if (isMounted) {
          setSuggestions(data.products || []);
          setShowSuggestions(true);
          setActiveIndex(-1);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchSuggestions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [debouncedQuery, category, minPrice, maxPrice, inStockOnly]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function buildSearchUrl(query?: string) {
    const params = new URLSearchParams();
    const trimmed = (query ?? q).trim();
    if (trimmed) params.set("q", trimmed);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStockOnly) params.set("inStock", "1");
    return params.toString() ? `/loja?${params.toString()}` : "/loja";
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    const trimmed = q.trim();
    if (trimmed.length >= 2) addSearchHistory(trimmed);
    onNavigate?.();
    router.push(buildSearchUrl());
  }

  function selectSuggestion(slug: string) {
    setShowSuggestions(false);
    onNavigate?.();
    router.push(`/produto/${slug}`);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const items = suggestions.length > 0 ? suggestions : [];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      e.preventDefault();
      selectSuggestion(items[activeIndex].slug);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  function startVoiceSearch() {
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setQ(transcript);
        inputRef.current?.focus();
      }
    };

    recognition.start();
  }

  const filtersPanel = (
    <div
      className={cn(
        "grid gap-2 rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/40 p-3 sm:grid-cols-3",
        !showFilters && "hidden",
      )}
    >
      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-brown-muted)]">
          Preço mín. (R$)
        </span>
        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="h-9 w-full rounded-lg border border-[var(--color-card-border)] px-2 text-sm"
        />
      </label>
      <label className="text-xs">
        <span className="mb-1 block text-[var(--color-brown-muted)]">
          Preço máx. (R$)
        </span>
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="h-9 w-full rounded-lg border border-[var(--color-card-border)] px-2 text-sm"
        />
      </label>
      <label className="flex items-end gap-2 text-sm">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
        />
        Apenas em estoque
      </label>
    </div>
  );

  const suggestionsDropdown = showSuggestions && (
    <div
      className="absolute top-[calc(100%+4px)] z-[100] w-full overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-white shadow-xl animate-in fade-in slide-in-from-top-2"
      role="listbox"
      id={listboxId}
      aria-live="polite"
    >
      {loading && suggestions.length === 0 ? (
        <div className="flex items-center justify-center p-4 text-sm text-[var(--color-brown-muted)]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Buscando...
        </div>
      ) : suggestions.length > 0 ? (
        <ul className="max-h-[300px] overflow-y-auto">
          {suggestions.map((product, index) => (
            <li key={product.id} role="option" aria-selected={index === activeIndex}>
              <Link
                href={`/produto/${product.slug}`}
                onClick={() => {
                  setShowSuggestions(false);
                  onNavigate?.();
                }}
                className={cn(
                  "flex items-center gap-3 p-3 transition hover:bg-[var(--secondary)]",
                  index === activeIndex && "bg-[var(--secondary)]",
                )}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--secondary)]">
                  <Image
                    src={product.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-brown)]">
                    {product.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-price)]">
                      {formatCurrency(product.priceCents)}
                    </p>
                    {product.categoryName && (
                      <span className="truncate text-xs text-[var(--color-brown-muted)]">
                        em {product.categoryName}
                      </span>
                    )}
                    {product.inStock === false && (
                      <span className="text-xs text-red-600">Sem estoque</span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
          <li className="border-t border-[var(--color-card-border)] p-2">
            <button
              type="button"
              className="w-full rounded-lg py-2 text-center text-sm font-medium text-[var(--color-cta)] transition hover:bg-[var(--color-cta)]/10"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as unknown as FormEvent);
              }}
            >
              Ver todos os resultados para &quot;{q}&quot;
            </button>
          </li>
        </ul>
      ) : q.length >= 2 ? (
        <div className="p-4 text-center text-sm text-[var(--color-brown-muted)]">
          Nenhum produto encontrado.
        </div>
      ) : history.length > 0 ? (
        <ul className="p-2">
          <li className="px-2 py-1 text-xs font-semibold text-[var(--color-brown-muted)]">
            {user ? "Buscas recentes" : "Buscas recentes (neste dispositivo)"}
          </li>
          {history.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--secondary)]"
                onClick={() => {
                  setQ(item);
                  setShowSuggestions(true);
                }}
              >
                <Clock className="h-3.5 w-3.5 text-[var(--color-brown-muted)]" />
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  const selectClass =
    variant === "panel"
      ? "h-11 w-full rounded-xl border border-[var(--color-card-border)] bg-white px-3 text-sm text-[var(--color-brown)]"
      : "h-11 min-w-[8.5rem] shrink-0 rounded-l-xl border border-r-0 border-[var(--color-card-border)] bg-[var(--secondary)] px-3 text-sm text-[var(--color-brown)] sm:min-w-[10rem]";

  const inputClass =
    variant === "panel"
      ? "h-11 w-full rounded-xl border border-[var(--color-card-border)] bg-white px-4 text-sm"
      : "h-11 min-w-0 flex-1 rounded-none border border-[var(--color-card-border)] bg-white px-4 text-sm";

  const toolbar = (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => setShowFilters((v) => !v)}
        aria-label="Filtros de busca"
        aria-expanded={showFilters}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={startVoiceSearch}
        aria-label="Busca por voz"
        aria-pressed={listening}
      >
        {listening ? (
          <MicOff className="h-4 w-4 text-red-500" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  if (variant === "panel") {
    return (
      <div ref={wrapperRef} className="relative w-full">
        <form
          onSubmit={handleSubmit}
          className={cn("space-y-3", className)}
          role="search"
        >
          <p className="font-display text-lg font-semibold text-[var(--color-brown)]">
            Encontre na loja
          </p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectClass}
            aria-label="Categoria"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          {filtersPanel}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => {
                loadHistory();
                if (q.length >= 2 || history.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="O que você procura?"
              className={inputClass}
              aria-label="Buscar produtos"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded={showSuggestions}
              role="combobox"
              autoComplete="off"
            />
            {toolbar}
          </div>
          <Button type="submit" className="w-full" size="lg">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </form>
        {suggestionsDropdown}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative flex w-full max-w-2xl flex-1 flex-col gap-2",
        className,
      )}
    >
      {filtersPanel}
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-1 items-stretch"
        role="search"
      >
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={cn(selectClass, "hidden sm:block")}
          aria-label="Categoria"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="relative flex min-w-0 flex-1 items-center">
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => {
              loadHistory();
              if (q.length >= 2 || getSearchHistory().length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Buscar máquinas, linhas, acessórios…"
            className={inputClass}
            aria-label="Buscar produtos"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={showSuggestions}
            role="combobox"
            autoComplete="off"
          />
          <div className="absolute right-2 flex items-center gap-0.5">
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            )}
            {toolbar}
          </div>
        </div>
        <Button
          type="submit"
          className="h-11 shrink-0 rounded-l-none rounded-r-xl px-5"
        >
          <Search className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Buscar</span>
        </Button>
      </form>
      {suggestionsDropdown}
    </div>
  );
}
