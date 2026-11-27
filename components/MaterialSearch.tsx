import React, { useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { UI_BTN_SECONDARY, UI_INPUT } from '../utils/uiClasses';
import {
  materialSearchSuggestions,
  normalizeSearchQuery,
  parseMaterialSearchHistory,
  readMaterialSearchHistory,
  saveMaterialSearchHistory,
} from '../utils/posewearSearchSuggestions';
import '../styles/material-search.css';

export default function MaterialSearch({
  value,
  role,
  onChange,
}: {
  value: string;
  role: string;
  onChange: (value: string) => void;
}) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(readMaterialSearchHistory);
  const [storageError, setStorageError] = useState(false);
  const suggestions = materialSearchSuggestions(value, role, language);
  const commit = (query: string) => {
    const normalized = normalizeSearchQuery(query);
    if (normalized) {
      const next = parseMaterialSearchHistory([normalized, ...recent]);
      setRecent(next);
      setStorageError(!saveMaterialSearchHistory(next));
      onChange(normalized);
    }
    input.current?.focus();
    setOpen(false);
  };
  return (
    <div
      className="material-browser-search material-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          input.current?.focus();
          setOpen(false);
        }
      }}
    >
      <label>
        {zh ? '搜尋素材' : 'Search materials'}
        <input
          ref={input}
          className={`block mt-1 w-full ${UI_INPUT}`}
          type="search"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit(value);
            }
            if (event.key === 'Escape') {
              event.stopPropagation();
              setOpen(false);
            }
          }}
        />
      </label>
      {open && (
        <div className="material-search-suggestions" data-testid="material-search-suggestions">
          {recent.length > 0 && (
            <section aria-label={zh ? '最近搜尋' : 'Recent searches'}>
              <h2>{zh ? '最近搜尋' : 'Recent searches'}</h2>
              <button
                type="button"
                className={UI_BTN_SECONDARY}
                onClick={() => {
                  setRecent([]);
                  setStorageError(!saveMaterialSearchHistory([]));
                }}
              >
                {zh ? '清除搜尋紀錄' : 'Clear search history'}
              </button>
              <div>
                {recent
                  .filter(
                    (query) =>
                      !value.trim() ||
                      query.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase()),
                  )
                  .map((query) => (
                    <button
                      className={UI_BTN_SECONDARY}
                      type="button"
                      key={query}
                      onClick={() => commit(query)}
                    >
                      {query}
                    </button>
                  ))}
              </div>
            </section>
          )}
          {suggestions.length > 0 && (
            <section aria-label={zh ? '建議搜尋' : 'Suggested searches'}>
              <h2>{zh ? '建議搜尋' : 'Suggested searches'}</h2>
              <div>
                {suggestions.map((query) => (
                  <button
                    className={UI_BTN_SECONDARY}
                    type="button"
                    key={query}
                    onClick={() => commit(query)}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
      {storageError && (
        <p role="status">
          {zh
            ? '搜尋可繼續使用，但無法將紀錄儲存到此裝置。'
            : 'Search still works, but recent searches cannot be saved on this device.'}
        </p>
      )}
    </div>
  );
}
