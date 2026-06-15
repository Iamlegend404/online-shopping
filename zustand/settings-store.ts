// stores/settings-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SelectedValue, groups } from "@/app/player/[...params]/controls/data";

type SettingsStore = {
  values: Record<string, SelectedValue>;
  setValue: (label: string, value: SelectedValue) => void;
  reset: () => void;
};
const PERSISTENT_KEYS = [
  "Aspect Ratio",
  "Mirror",
  "Font size",
  "Font color", // ← add
  "Background opacity", // ← add
  "Playback speed",
  "Autoplay",
  "Loop",
  "Brightness",
];

const defaultValues: Record<string, SelectedValue> = Object.fromEntries(
  groups.flatMap((g) =>
    g.items
      .filter((i) => i.value != null)
      .map((i) => [
        i.label,
        {
          display: i.value as string,
          id: (i.value as string).toLowerCase(),
        },
      ]),
  ),
);

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      values: defaultValues,
      setValue: (label, value) =>
        set((state) => ({
          values: { ...state.values, [label]: value },
        })),
      reset: () => set({ values: defaultValues }),
    }),
    {
      name: "player-settings",
      partialize: (state) => ({
        values: Object.fromEntries(
          Object.entries(state.values).filter(([key]) =>
            PERSISTENT_KEYS.includes(key),
          ),
        ),
      }),
      merge: (persisted: any, current) => ({
        ...current,
        values: {
          ...current.values, // defaults first
          ...persisted.values, // persisted on top
        },
      }),
    },
  ),
);

// merge: (persisted: any, current) => ({
//       ...current,
//       values: {
//         ...current.values, // defaults first
//         ...persisted.values, // persisted on top
//       },
//     }),
// Before fix:
// defaults → { "Audio Dub": "Auto", "Aspect Ratio": "16:9", ... }
// localStorage loads → { "Aspect Ratio": "16:9" }  ← replaces everything
// result → "Audio Dub" is GONE

// After fix:
// defaults → { "Audio Dub": "Auto", "Aspect Ratio": "16:9", ... }
// localStorage loads → { "Aspect Ratio": "16:9" }  ← merges on top
// result → "Audio Dub": "Auto" SURVIVES, "Aspect Ratio": "16:9" from localStorage
