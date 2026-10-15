"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { api } from "@/lib/api-client";

interface CategoryRule {
  category: string;
  validFrom: string;
  validTo: string;
  multiDay: boolean;
  active: boolean;
}

interface Settings {
  eventName: string;
  venue: string;
  eventDates: string[];
  categoryRules: CategoryRule[];
}

export default function CategoriesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const data = await api<{ settings: Settings }>("/api/categories");
    setSettings(data.settings);
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  async function save() {
    if (!settings) return;
    try {
      const data = await api<{ settings: Settings }>("/api/categories", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(data.settings);
      setMessage("Categories and date rules saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    }
  }

  function updateRule(index: number, patch: Partial<CategoryRule>) {
    if (!settings) return;
    const next = [...settings.categoryRules];
    next[index] = { ...next[index], ...patch };
    if (patch.multiDay === false) {
      next[index].validTo = next[index].validFrom;
    }
    setSettings({ ...settings, categoryRules: next });
  }

  if (!settings) {
    return <p className="text-[var(--muted)]">Loading categories...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="page-kicker">Pass Rules</p>
          <h1 className="text-3xl font-bold uppercase tracking-[0.06em]">
            Ticket categories & dates
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Configure pass type, authorization, and allowed event dates.
          </p>
        </div>
        <button className="btn btn-primary" onClick={save}>
          Save rules
        </button>
      </div>

      {message ? (
        <p className="panel px-4 py-3 text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      <section className="panel grid gap-3 p-5 md:grid-cols-2">
        <div className="field">
          <label>Event name</label>
          <input
            value={settings.eventName}
            onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Venue</label>
          <input
            value={settings.venue}
            onChange={(e) => setSettings({ ...settings, venue: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-3">
        {settings.categoryRules.map((rule, index) => {
          const meta = DEFAULT_CATEGORIES.find((c) => c.name === rule.category);
          return (
            <div key={rule.category} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: meta?.color || "#64748B" }}
                    />
                    <h2 className="text-lg font-semibold">{rule.category}</h2>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {meta?.description || "Assigned date + category authorization"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={rule.active}
                    onChange={(e) => updateRule(index, { active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="field">
                  <label>Valid from</label>
                  <input
                    type="date"
                    value={rule.validFrom}
                    onChange={(e) =>
                      updateRule(index, {
                        validFrom: e.target.value,
                        validTo: rule.multiDay ? rule.validTo : e.target.value,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label>Valid to</label>
                  <input
                    type="date"
                    value={rule.validTo}
                    disabled={!rule.multiDay}
                    onChange={(e) => updateRule(index, { validTo: e.target.value })}
                  />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={rule.multiDay}
                    onChange={(e) =>
                      updateRule(index, {
                        multiDay: e.target.checked,
                        validTo: e.target.checked ? rule.validTo : rule.validFrom,
                      })
                    }
                  />
                  Multi-day pass (all event days in range)
                </label>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
