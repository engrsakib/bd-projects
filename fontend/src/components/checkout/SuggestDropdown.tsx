import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, PlusCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

const SuggestionDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  required,
  creatable,
  onCreate,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  creatable?: boolean;
  onCreate?: (val: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return options;
    const s = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(s));
  }, [options, search]);

  const canCreate =
    creatable && search.trim().length > 0 && !options.some((o) => o.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-12 w-full font-bangla items-center justify-between rounded-lg border px-4 text-sm outline-none transition",
            "border-gray-300 bg-white hover:border-primary focus:ring-2 focus:ring-primary/70",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span className={!value ? "text-gray-500" : "text-secondary"}>{value || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0 font-bangla">
        <div className="p-2">
          <Input
            className="h-10 font-bangla"
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <Separator />
        <ul className="max-h-60 overflow-auto py-1 text-sm" role="listbox">
          {canCreate && (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-primary hover:bg-primary/5"
                onClick={() => {
                  const name = search.trim();
                  onCreate?.(name);
                  onChange(name);
                  setSearch("");
                  setOpen(false);
                }}
              >
                <PlusCircle className="h-4 w-4" /> Add “{search.trim()}”
              </button>
            </li>
          )}

          {filtered.length ? (
            filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setSearch("");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full font-bangla items-center gap-2 px-3 py-2 text-left transition hover:bg-gray-50",
                    value === opt && "bg-gray-50"
                  )}
                  role="option"
                  aria-selected={value === opt}
                >
                  {opt}
                </button>
              </li>
            ))
          ) : !canCreate ? (
            <li className="px-3 py-2 text-gray-500">No results</li>
          ) : null}
        </ul>
      </PopoverContent>
      {required && <input type="text" className="sr-only" required value={value} onChange={() => { }} />}
    </Popover>
  );
};

export default SuggestionDropdown;