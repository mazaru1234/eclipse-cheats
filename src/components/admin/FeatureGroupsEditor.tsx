"use client";

import { Plus, Trash2 } from "lucide-react";
import { adminInputCls, PrimaryButton } from "./AdminPrimitives";
import type { FeatureGroup } from "@/lib/admin-product-form";

interface FeatureGroupsEditorProps {
  groups: FeatureGroup[];
  onChange: (groups: FeatureGroup[]) => void;
}

function itemsToText(items: string[]): string {
  return items.join("\n");
}

function textToItems(text: string): string[] {
  return text.split("\n").map((line) => line.trimEnd());
}

export function FeatureGroupsEditor({ groups, onChange }: FeatureGroupsEditorProps) {
  function updateGroup(index: number, patch: Partial<FeatureGroup>) {
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  }

  function updateItemsText(groupIndex: number, text: string) {
    updateGroup(groupIndex, { items: textToItems(text) });
  }

  function addGroup() {
    onChange([...groups, { name: "", items: [] }]);
  }

  function removeGroup(index: number) {
    onChange(groups.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4"
        >
          <div className="mb-3 flex items-center gap-3">
            <input
              type="text"
              value={group.name}
              onChange={(e) => updateGroup(groupIndex, { name: e.target.value })}
              placeholder="Название группы (AIM, ESP, MISC…)"
              className={`${adminInputCls} font-medium`}
            />
            <button
              type="button"
              onClick={() => removeGroup(groupIndex)}
              className="shrink-0 text-[var(--color-danger)] hover:opacity-80"
              aria-label="Удалить группу"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <textarea
            rows={5}
            value={itemsToText(group.items)}
            onChange={(e) => updateItemsText(groupIndex, e.target.value)}
            placeholder={"Silent Aim\nSmooth aim\nFOV slider"}
            className={`${adminInputCls} min-h-[120px] resize-y font-mono text-xs leading-relaxed`}
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Каждая строка — отдельная функция</p>
        </div>
      ))}

      <PrimaryButton onClick={addGroup}>
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Добавить группу функций
        </span>
      </PrimaryButton>
    </div>
  );
}
