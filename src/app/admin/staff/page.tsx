"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pagination } from "@/components/Pagination";
import { PASS_CATEGORIES } from "@/lib/constants";
import { api } from "@/lib/api-client";
import type { PassCategory, UserRole } from "@/lib/types";

const PAGE_SIZE = 25;

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  allowedCategories: PassCategory[];
  active: boolean;
  createdAt?: string;
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "staff" as UserRole,
  allowedCategories: [] as PassCategory[],
  allCategories: true,
  active: true,
};

export default function StaffPage() {
  const [items, setItems] = useState<StaffUser[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

  async function load(nextPage = page, resetPage = false) {
    const pageToLoad = resetPage ? 1 : nextPage;
    const params = new URLSearchParams();
    params.set("page", String(pageToLoad));
    params.set("limit", String(PAGE_SIZE));
    if (q) params.set("q", q);
    if (roleFilter) params.set("role", roleFilter);
    if (activeFilter) params.set("active", activeFilter);
    const data = await api<{ items: StaffUser[]; total: number; page: number }>(
      `/api/staff?${params}`
    );
    setItems(data.items);
    setTotal(data.total);
    setPage(data.page);
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  function startEdit(user: StaffUser) {
    const allCategories =
      user.role === "admin" || user.allowedCategories.length === 0;
    setEditingId(user._id);
    setEditPassword("");
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      allowedCategories: allCategories ? [] : [...user.allowedCategories],
      allCategories,
      active: user.active,
    });
    setMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setEditPassword("");
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const allowedCategories = form.allCategories ? [] : form.allowedCategories;
      if (editingId) {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          allowedCategories,
          active: form.active,
        };
        if (editPassword.trim()) body.password = editPassword.trim();
        await api(`/api/staff/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setMessage("User updated.");
      } else {
        await api("/api/staff", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            allowedCategories,
            active: form.active,
          }),
        });
        setMessage(
          form.role === "admin"
            ? "Admin account created."
            : "Staff account created. They can log in at /login."
        );
      }
      resetForm();
      await load(1, true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(user: StaffUser) {
    try {
      await api(`/api/staff/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active }),
      });
      setMessage(user.active ? "User deactivated." : "User activated.");
      await load(page);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(user: StaffUser) {
    if (!confirm(`Delete ${user.name} (${user.email})?`)) return;
    try {
      await api(`/api/staff/${user._id}`, { method: "DELETE" });
      if (editingId === user._id) resetForm();
      setMessage("User deleted.");
      const nextTotal = Math.max(0, total - 1);
      const lastPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      await load(Math.min(page, lastPage));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function toggleCategory(category: PassCategory) {
    setForm((prev) => {
      const has = prev.allowedCategories.includes(category);
      return {
        ...prev,
        allCategories: false,
        allowedCategories: has
          ? prev.allowedCategories.filter((c) => c !== category)
          : [...prev.allowedCategories, category],
      };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="page-kicker">Team Roster</p>
        <h1 className="text-3xl font-bold uppercase tracking-[0.06em]">Staff</h1>
        <p className="mt-1 text-[var(--muted)]">
          Create gate staff or admins, set category access, and activate or
          deactivate accounts.
        </p>
      </div>

      {message ? (
        <p className="panel px-4 py-3 text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={onSubmit} className="panel space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit user" : "Create staff"}
            </h2>
            {editingId ? (
              <button
                type="button"
                className="btn btn-ghost !px-3 !py-1.5 text-xs"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="field sm:col-span-2">
              <label>Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field sm:col-span-2">
              <label>Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {!editingId ? (
              <div className="field sm:col-span-2">
                <label>Password</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Min 8 characters"
                />
              </div>
            ) : (
              <div className="field sm:col-span-2">
                <label>New password (optional)</label>
                <input
                  type="password"
                  minLength={8}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
            )}
            <div className="field">
              <label>Role</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as UserRole,
                    allCategories:
                      e.target.value === "admin" ? true : form.allCategories,
                  })
                }
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={form.active ? "active" : "inactive"}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.value === "active" })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--line)] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Scanner category access</p>
              <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={form.allCategories || form.role === "admin"}
                  disabled={form.role === "admin"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      allCategories: e.target.checked,
                      allowedCategories: e.target.checked
                        ? []
                        : form.allowedCategories,
                    })
                  }
                />
                All categories
              </label>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Empty / all means staff can verify every pass type. Admins always
              have full access.
            </p>
            <div className="flex flex-wrap gap-2">
              {PASS_CATEGORIES.map((category) => {
                const checked =
                  form.allCategories ||
                  form.role === "admin" ||
                  form.allowedCategories.includes(category);
                return (
                  <label
                    key={category}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                      checked
                        ? "border-[var(--accent)] bg-[rgba(45,212,191,0.12)]"
                        : "border-[var(--line)] text-[var(--muted)]"
                    } ${form.role === "admin" || form.allCategories ? "opacity-60" : ""}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      disabled={form.role === "admin" || form.allCategories}
                      checked={checked}
                      onChange={() => toggleCategory(category)}
                    />
                    {category}
                  </label>
                );
              })}
            </div>
          </div>

          <button className="btn btn-primary" disabled={loading}>
            {loading
              ? "Saving..."
              : editingId
                ? "Save changes"
                : "Create account"}
          </button>
        </form>

        <section className="panel p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              className="min-w-[180px] flex-1 rounded-xl border border-[var(--line)] bg-[rgba(7,17,31,0.65)] px-3 py-2"
              placeholder="Search name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="rounded-xl border border-[var(--line)] bg-[rgba(7,17,31,0.65)] px-3 py-2"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="rounded-xl border border-[var(--line)] bg-[rgba(7,17,31,0.65)] px-3 py-2"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button
              className="btn btn-ghost"
              onClick={() =>
                load(1, true).catch((err) => setMessage(err.message))
              }
            >
              Filter
            </button>
          </div>

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Access</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {user.email}
                      </div>
                    </td>
                    <td className="capitalize">{user.role}</td>
                    <td>
                      <div className="max-w-[180px] text-xs text-[var(--muted)]">
                        {user.role === "admin" ||
                        user.allowedCategories.length === 0
                          ? "All categories"
                          : user.allowedCategories.join(", ")}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          user.active
                            ? "border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.12)] text-[var(--ok)]"
                            : "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[var(--danger)]"
                        }`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="btn btn-ghost !px-2 !py-1 text-xs"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost !px-2 !py-1 text-xs"
                          onClick={() => toggleActive(user)}
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btn-danger !px-2 !py-1 text-xs"
                          onClick={() => remove(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={5} className="text-[var(--muted)]">
                      No users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            limit={PAGE_SIZE}
            total={total}
            onPageChange={(next) => {
              load(next).catch((err) => setMessage(err.message));
            }}
          />
        </section>
      </div>
    </div>
  );
}
