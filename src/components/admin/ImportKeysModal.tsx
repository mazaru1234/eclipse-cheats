"use client";

import { useMemo, useState } from "react";
import { Package, Ticket } from "lucide-react";
import { adminInputCls, PrimaryButton } from "./AdminPrimitives";
import { formatCurrency } from "@/lib/utils";
import type { KeyImportLine } from "@/lib/services/keys";

interface Props {
  lines: KeyImportLine[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportKeysModal({ lines, onClose, onSuccess }: Props) {
  const [lineId, setLineId] = useState("");
  const [productId, setProductId] = useState("");
  const [lineSearch, setLineSearch] = useState("");
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);
  const [keysText, setKeysText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ imported: number; skipped: number } | null>(null);

  const filteredLines = useMemo(() => {
    const q = lineSearch.trim().toLowerCase();
    if (!q) return lines.slice(0, 30);
    return lines
      .filter(
        (line) =>
          line.name.toLowerCase().includes(q) ||
          line.gameName.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [lineSearch, lines]);

  const selectedLine = lines.find((line) => line.id === lineId);
  const selectedTier = selectedLine?.tiers.find((tier) => tier.id === productId);

  const keyLines = useMemo(
    () => [...new Set(keysText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))],
    [keysText]
  );

  const BATCH_SIZE = 100;

  async function importBatch(batch: string[]) {
    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, keys: batch }),
    });

    let data: { error?: string; imported?: number } = {};
    try {
      data = await res.json();
    } catch {
      throw new Error(`Сервер вернул некорректный ответ (${res.status})`);
    }

    if (!res.ok) {
      throw new Error(data.error || `Ошибка импорта (${res.status})`);
    }

    return data.imported ?? batch.length;
  }

  function selectLine(id: string) {
    setLineId(id);
    setProductId("");
    setLineDropdownOpen(false);
    setLineSearch("");
  }

  async function handleSubmit() {
    setError("");
    if (!lineId) {
      setError("Выберите товар");
      return;
    }
    if (!productId) {
      setError("Выберите тариф");
      return;
    }
    if (keyLines.length === 0) {
      setError("Вставьте хотя бы один ключ");
      return;
    }

    setSubmitting(true);
    try {
      const linesRes = await fetch("/api/admin/keys?list=lines");
      const linesData = await linesRes.json();
      const tierExists = (linesData.lines ?? []).some((line: KeyImportLine) =>
        line.tiers.some((tier) => tier.id === productId)
      );
      if (!tierExists) {
        setError("Тариф не найден. Закройте окно, обновите страницу и выберите тариф снова.");
        return;
      }

      let importedTotal = 0;

      for (let i = 0; i < keyLines.length; i += BATCH_SIZE) {
        const batch = keyLines.slice(i, i + BATCH_SIZE);
        importedTotal += await importBatch(batch);
      }

      setSuccess({ imported: importedTotal, skipped: keyLines.length - importedTotal });
      setTimeout(onSuccess, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Импорт ключей</h2>
          <button type="button" onClick={onClose} className="text-[var(--color-text-muted)] hover:text-gold">
            ✕
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <p className="text-lg font-bold text-[var(--color-success)]">Импорт завершён</p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Загружено: {success.imported} · Пропущено: {success.skipped}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-text-muted)]">
                1. Товар
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLineDropdownOpen((open) => !open)}
                  className={`${adminInputCls} flex items-center justify-between text-left`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Package className="h-4 w-4 shrink-0 text-gold opacity-70" aria-hidden />
                    <span className="truncate">
                      {selectedLine
                        ? `${selectedLine.gameName} — ${selectedLine.name}`
                        : "Выберите товар…"}
                    </span>
                  </span>
                  <span className="text-[var(--color-text-muted)]">▾</span>
                </button>
                {lineDropdownOpen && (
                  <div className="absolute z-10 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 shadow-xl">
                    <input
                      type="text"
                      autoFocus
                      value={lineSearch}
                      onChange={(e) => setLineSearch(e.target.value)}
                      placeholder="Поиск по игре или товару…"
                      className={adminInputCls}
                    />
                    <div className="mt-2 space-y-1">
                      {filteredLines.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">Ничего не найдено</p>
                      ) : (
                        filteredLines.map((line) => (
                          <button
                            key={line.id}
                            type="button"
                            onClick={() => selectLine(line.id)}
                            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-elevated)] ${
                              line.id === lineId ? "bg-[rgba(232,185,35,0.1)] text-gold" : ""
                            }`}
                          >
                            <span className="block font-medium">{line.name}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {line.gameName} · {line.tiers.length}{" "}
                              {line.tiers.length === 1 ? "тариф" : line.tiers.length < 5 ? "тарифа" : "тарифов"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedLine && (
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-[var(--color-text-muted)]">
                  2. Тариф
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedLine.tiers.map((tier) => {
                    const active = tier.id === productId;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setProductId(tier.id)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          active
                            ? "border-gold bg-[rgba(232,185,35,0.1)]"
                            : "border-[var(--color-border)] hover:border-[rgba(232,185,35,0.3)]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-gold" aria-hidden />
                          <span className="font-semibold">{tier.durationLabel}</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {formatCurrency(tier.price)} · в наличии: {tier.stockCount}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-text-muted)]">
                3. Ключи (по одному на строку)
              </label>
              {selectedTier && (
                <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
                  Загрузка в: {selectedLine?.gameName} — {selectedLine?.name} — {selectedTier.durationLabel}
                </p>
              )}
              <textarea
                rows={7}
                value={keysText}
                onChange={(e) => setKeysText(e.target.value)}
                placeholder="XXXXX-XXXXX-XXXXX"
                className={`${adminInputCls} font-mono`}
                disabled={!productId}
              />
            </div>

            {error && <p className="mb-4 text-xs text-[var(--color-danger)]">{error}</p>}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Отмена
              </button>
              <PrimaryButton
                onClick={handleSubmit}
                disabled={submitting || !productId || keyLines.length === 0}
              >
                {submitting ? "Загрузка…" : `Импортировать ${keyLines.length || ""}`}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
