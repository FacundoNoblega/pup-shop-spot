import { CATEGORIES, type Category } from "@/types/product";
import { cn } from "@/lib/utils";
import { Dog, Bone, Sparkles, Bug, LayoutGrid } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  Alimentos: <Bone className="w-4 h-4" />,
  Accesorios: <Dog className="w-4 h-4" />,
  Higiene: <Sparkles className="w-4 h-4" />,
  Venenos: <Bug className="w-4 h-4" />,
};

interface Props {
  selected: Category | null;
  onSelect: (cat: Category | null) => void;
}

export function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
          selected === null
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        Todos
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(selected === cat ? null : cat)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            selected === cat
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {ICONS[cat]}
          {cat}
        </button>
      ))}
    </div>
  );
}
