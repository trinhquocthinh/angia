import { useId, useState, type KeyboardEvent } from 'react';
import { HeaderSearchResults, type HeaderSearchItem } from './HeaderSearchResults';
import { SearchGlyph } from './SearchGlyph';

type Props = {
  label: string;
  placeholder: string;
  emptyText: string;
  search: (query: string) => HeaderSearchItem[];
  onSelect: (item: HeaderSearchItem) => void;
  className?: string;
};

// Ô tìm kiếm trên header theo mẫu combobox ARIA: gõ để lọc, ↑/↓ chọn, Enter mở, Esc đóng.
export function HeaderSearch({ label, placeholder, emptyText, search, onSelect, className = '' }: Props) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = search(query);
  const expanded = open && query.trim().length > 0;
  const choose = (item: HeaderSearchItem) => {
    setQuery('');
    setOpen(false);
    onSelect(item);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') return setOpen(false);
    if (event.key === 'Enter' && expanded && items[activeIndex]) return choose(items[activeIndex]);
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    setOpen(true);
    setActiveIndex((index) => (items.length ? (index + step + items.length) % items.length : 0));
  };
  return (
    <div className={`relative ${className}`}>
      <SearchGlyph />
      <input
        type="search"
        role="combobox"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && items.length ? `${listId}-${activeIndex}` : undefined}
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="h-12 w-full rounded-xl border border-[#bfc9c4]/30 bg-[#eaf6f5] pr-4 pl-10 text-[13px] text-[#131d1d] shadow-inner transition-colors placeholder:text-[#404945] hover:bg-[#e4f0f0] focus:bg-white focus:shadow-[0_0_0_2px_#b3eddf] focus:outline-none lg:h-10"
      />
      {expanded && (
        <HeaderSearchResults
          listId={listId}
          items={items}
          activeIndex={activeIndex}
          emptyText={emptyText}
          onSelect={choose}
        />
      )}
    </div>
  );
}
