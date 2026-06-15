// submenu-panel.tsx
import { ChevronLeft, Check } from "lucide-react";
import { SettingsItem, SettingsOption } from "./data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SelectedValue } from "./data";
type Props = {
  item: SettingsItem;
  currentValue: SelectedValue | null; // ← was string | null
  onSelect: (option: SettingsOption) => void;
  onBack: () => void;
};
export function SubmenuPanel({ item, currentValue, onSelect, onBack }: Props) {
  // console.log("item", item);
  // console.log(currentValue, item.options);

  return (
    <div>
      <div className="flex items-center gap-2 lg:px-2 px-1.5 lg:py-3 py-1.5 border-b border-neutral-800">
        <button
          onClick={onBack}
          className="p-1 hover:bg-neutral-800 rounded-sm transition-colors"
        >
          <ChevronLeft size={18} className="text-neutral-400" />
        </button>
        <item.Icon size={18} className="text-neutral-400" />
        <p className="text-muted-foreground lg:text-sm text-xs uppercase tracking-wider font-medium">
          {item.label}
        </p>
      </div>

      <ScrollArea className="lg:max-h-[60vh] max-h-[40vh]">
        <div className="py-1">
          {item.options?.map((option, index) => {
            const isSelected = currentValue?.id === option.id;

            return (
              <button
                key={`${option.id}-${index}`}
                onClick={() => {
                  if (item.label === "Download") {
                    window.open(option.id, "_blank"); // id is the link
                  } else {
                    onSelect(option);
                  }
                }} // ← pass full option, not String(id)
                className="flex items-center justify-between w-full lg:px-3 px-2 lg:py-3 py-2 hover:bg-neutral-800 transition-colors rounded-sm"
              >
                <span className="text-neutral-300 lg:text-base text-sm">
                  {option.display}
                </span>
                {isSelected && <Check size={15} className="text-white" />}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
