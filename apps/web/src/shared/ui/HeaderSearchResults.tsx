export type HeaderSearchItem = { id: string; label: string; hint?: string | undefined };

type Props = {
  listId: string;
  items: HeaderSearchItem[];
  activeIndex: number;
  emptyText: string;
  onSelect: (item: HeaderSearchItem) => void;
};

// Danh sách gợi ý dạng listbox; onMouseDown chặn blur để click kịp chọn trước khi danh sách đóng.
export function HeaderSearchResults({ listId, items, activeIndex, emptyText, onSelect }: Props) {
  return (
    <ul
      id={listId}
      role="listbox"
      className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 m-0 max-h-80 min-w-64 list-none overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_8px_28px_rgba(22,62,52,0.14)]"
    >
      {items.length === 0 ? (
        <li className="px-3 py-2.5 text-sm text-[#55615f]">{emptyText}</li>
      ) : (
        items.map((item, index) => (
          <li
            key={item.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm ${index === activeIndex ? 'bg-[#e4f0f0]' : 'hover:bg-[#f0fcfb]'}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(item)}
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#b3eddf] font-semibold text-[#004135]"
            >
              {item.label.slice(0, 1).toLocaleUpperCase('vi')}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-[#131d1d]">{item.label}</span>
              {item.hint && <span className="block truncate text-xs text-[#55615f]">{item.hint}</span>}
            </span>
          </li>
        ))
      )}
    </ul>
  );
}
