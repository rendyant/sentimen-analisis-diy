"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LogOut,
  RefreshCw,
  Check,
  X,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AuthBackground from "@/features/register/components/AuthBackground";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ENDPOINT = {
  all: "/admin/users",
  pending: "/admin/users/pending",
  approval: (id: string) => `/admin/users/${id}/approval`,
  user: (id: string) => `/admin/users/${id}`,
};

const HISTORY_KEY = "admin_processed_users";
const PAGE_SIZE = 10;

type Status = "pending" | "active" | "rejected";
type Action = "approve" | "reject";
type Filter = "all" | Status;
type Sort = "newest" | "oldest" | "name";

type Row = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: Status;
  opd_id?: string | null;
  opd_name?: string | null;
  created_at?: string | null;
  approved_at?: string | null;
  approved_by_name?: string | null;
};

type Confirm =
  | { kind: "single"; user: Row; action: Action }
  | { kind: "bulk"; ids: string[]; action: Action }
  | null;

type Notice = { text: string; ok: boolean } | null;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "active", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" },
];

const BADGE: Record<Status, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  active: { label: "Disetujui", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Ditolak", cls: "bg-red-50 text-red-700 ring-red-200" },
};

/* ---------- helpers ---------- */

function readStorage(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function clearSession() {
  ["access_token", "user"].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

function readHistory(): Row[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pushHistory(row: Row) {
  try {
    const rest = readHistory().filter((r) => r.id !== row.id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([row, ...rest].slice(0, 500)));
  } catch {
    /* storage penuh / diblokir: abaikan */
  }
}

function updateHistory(row: Row) {
  try {
    const list = readHistory();
    if (!list.some((r) => r.id === row.id)) return;
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(list.map((r) => (r.id === row.id ? row : r)))
    );
  } catch {
    /* abaikan */
  }
}

function removeFromHistory(id: string) {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(readHistory().filter((r) => r.id !== id))
    );
  } catch {
    /* abaikan */
  }
}

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function time(value?: string | null): number {
  const t = value ? new Date(value).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- page ---------- */

export default function AdminPendingUsersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [fullList, setFullList] = useState(true);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const [editing, setEditing] = useState<Row | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const logout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = readStorage("access_token");
      const res = await fetch(`${API}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout();
        throw new ApiError("Sesi berakhir. Silakan masuk kembali.", 401);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.detail;
        const msg = Array.isArray(detail)
          ? String(detail[0]?.msg ?? "").replace("Value error, ", "")
          : detail;
        throw new ApiError(msg || `Permintaan gagal (${res.status})`, res.status);
      }
      return data;
    },
    [logout]
  );

  /* ---- load ---- */

  const loadUsers = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const history = readHistory();
      try {
        let list: Row[];
        try {
          const data = await request(ENDPOINT.all);
          list = Array.isArray(data) ? data : [];
          setFullList(true);
        } catch (err) {
          if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
            const data = await request(ENDPOINT.pending);
            const fetched: Row[] = Array.isArray(data) ? data : [];
            const historyIds = new Set(history.map((h) => h.id));
            list = [...fetched.filter((u) => !historyIds.has(u.id)), ...history];
            setFullList(false);
          } else {
            throw err;
          }
        }
        setRows(list);
      } catch (err) {
        setRows((prev) => (prev.length ? prev : history));
        setNotice({
          text:
            err instanceof TypeError
              ? "Tidak dapat terhubung ke server."
              : err instanceof Error
                ? err.message
                : "Gagal memuat data.",
          ok: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [request]
  );

  useEffect(() => {
    const token = readStorage("access_token");
    const raw = readStorage("user");
    let user: { role?: string; full_name?: string } | null = null;
    try {
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }
    if (!token || user?.role !== "admin") {
      router.replace("/login");
      return;
    }
    setAdminName(user.full_name ?? "Admin");
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (ready) loadUsers();
  }, [ready, loadUsers]);

  // notifikasi hilang otomatis
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  // Esc menutup modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirm) setConfirm(null);
      else if (deleting && !deleteBusy) setDeleting(null);
      else if (editing && !saving) setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, deleting, deleteBusy, editing, saving]);

  /* ---- derived ---- */

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, pending: 0, active: 0, rejected: 0 };
    rows.forEach((r) => {
      if (r.status in c) c[r.status] += 1;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.opd_name ?? "").toLowerCase().includes(q)
      );
    });
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.full_name.localeCompare(b.full_name, "id"));
    else if (sort === "oldest")
      sorted.sort((a, b) => time(a.created_at) - time(b.created_at));
    else sorted.sort((a, b) => time(b.created_at) - time(a.created_at));
    return sorted;
  }, [rows, filter, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pendingInFiltered = useMemo(
    () => filtered.filter((r) => r.status === "pending"),
    [filtered]
  );
  const selectedIds = useMemo(
    () => pendingInFiltered.filter((r) => selected.has(r.id)).map((r) => r.id),
    [pendingInFiltered, selected]
  );
  const allSelected =
    pendingInFiltered.length > 0 && selectedIds.length === pendingInFiltered.length;

  const showOpd = rows.some((r) => r.opd_name);
  const showDate = rows.some((r) => r.created_at);

  /* ---- actions ---- */

  const setBusy = (ids: string[], on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const applyAction = useCallback(
    async (user: Row, action: Action) => {
      await request(ENDPOINT.approval(user.id), {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      const done: Row = {
        ...user,
        status: action === "approve" ? "active" : "rejected",
        approved_at: new Date().toISOString(),
        approved_by_name: adminName,
      };
      if (!fullList) pushHistory(done);
      setRows((prev) => prev.map((r) => (r.id === user.id ? done : r)));
      setSelected((prev) => {
        if (!prev.has(user.id)) return prev;
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    },
    [request, adminName, fullList]
  );

  async function runConfirm() {
    if (!confirm) return;
    const current = confirm;
    setConfirm(null);
    setNotice(null);

    if (current.kind === "single") {
      const { user, action } = current;
      setBusy([user.id], true);
      try {
        await applyAction(user, action);
        setNotice({
          text:
            action === "approve"
              ? `${user.full_name} berhasil disetujui dan sekarang bisa masuk.`
              : `Pendaftaran ${user.full_name} ditolak.`,
          ok: true,
        });
        if (fullList) loadUsers(true);
      } catch (err) {
        setNotice({
          text: err instanceof Error ? err.message : "Aksi gagal diproses.",
          ok: false,
        });
      } finally {
        setBusy([user.id], false);
      }
      return;
    }

    // bulk
    const targets = rows.filter((r) => current.ids.includes(r.id));
    setBusy(current.ids, true);
    let ok = 0;
    let failed = 0;
    for (const u of targets) {
      try {
        await applyAction(u, current.action);
        ok += 1;
      } catch {
        failed += 1;
      } finally {
        setBusy([u.id], false);
      }
    }
    const verb = current.action === "approve" ? "disetujui" : "ditolak";
    setNotice({
      text:
        failed === 0
          ? `${ok} user berhasil ${verb}.`
          : `${ok} user ${verb}, ${failed} gagal diproses.`,
      ok: failed === 0,
    });
    if (fullList) loadUsers(true);
  }

  function openEdit(u: Row) {
    setEditing(u);
    setEditName(u.full_name);
    setEditEmail(u.email);
    setEditError("");
  }

  async function saveEdit() {
    if (!editing) return;
    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    if (name.length < 2) return setEditError("Nama minimal 2 karakter.");
    if (!EMAIL_RE.test(email)) return setEditError("Format email tidak valid.");

    const body: Record<string, string> = {};
    if (name !== editing.full_name) body.full_name = name;
    if (email !== editing.email) body.email = email;
    if (Object.keys(body).length === 0) return setEditing(null);

    setSaving(true);
    setEditError("");
    try {
      const data = await request(ENDPOINT.user(editing.id), {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const updated: Row = {
        ...editing,
        ...data,
        full_name: data.full_name ?? name,
        email: data.email ?? email,
      };
      setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      updateHistory(updated);
      setEditing(null);
      setNotice({ text: `Data ${updated.full_name} berhasil diperbarui.`, ok: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        setEditError("Endpoint PATCH /admin/users/{id} belum tersedia di backend.");
      } else {
        setEditError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
      }
    } finally {
      setSaving(false);
    }
  }

  function openDelete(u: Row) {
    setDeleting(u);
    setDeleteError("");
  }

  async function runDelete() {
    if (!deleting) return;
    const user = deleting;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await request(ENDPOINT.user(user.id), { method: "DELETE" });
      removeFromHistory(user.id);
      setRows((prev) => prev.filter((r) => r.id !== user.id));
      setSelected((prev) => {
        if (!prev.has(user.id)) return prev;
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
      setDeleting(null);
      setNotice({ text: `${user.full_name} berhasil dihapus.`, ok: true });
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 405 || (err.status === 404 && err.message === "Not Found"))
      ) {
        setDeleteError("Endpoint DELETE /admin/users/{id} belum tersedia di backend.");
      } else {
        setDeleteError(err instanceof Error ? err.message : "Gagal menghapus user.");
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pendingInFiltered.forEach((r) => next.delete(r.id));
      else pendingInFiltered.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!ready) return null;

  const busyAny = busyIds.size > 0;
  const editDirty =
    !!editing &&
    (editName.trim() !== editing.full_name ||
      editEmail.trim().toLowerCase() !== editing.email);
  const columnCount = 4 + (showOpd ? 1 : 0) + (showDate ? 1 : 0);

  const emptyText = query
    ? `Tidak ada hasil untuk “${query}”.`
    : !fullList && filter !== "pending" && filter !== "all"
      ? "Belum ada riwayat di browser ini."
      : "Tidak ada data pada daftar ini.";

  return (
    <AuthBackground>
      <section className="w-full max-w-6xl rounded-2xl border border-gray-200 bg-white px-7 py-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/Logo(2).png"
              alt="Logo Pemerintah Daerah DIY"
              width={36}
              height={42}
              priority
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-[#9b1c1c]">
                PERSETUJUAN USER
              </h1>
              <p className="text-[11px] font-medium text-gray-500">
                Masuk sebagai {adminName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                loadUsers();
              }}
              disabled={loading}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Muat ulang
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#9b1c1c]/30 px-3 text-xs font-semibold text-[#9b1c1c] transition-colors hover:bg-[#9b1c1c]/5"
            >
              <LogOut className="size-3.5" />
              Keluar
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 overflow-x-auto border-b border-gray-200">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
                className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-[13px] font-semibold transition-colors ${
                  active
                    ? "border-[#9b1c1c] text-[#9b1c1c]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    active ? "bg-[#9b1c1c] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, email, atau OPD..."
              className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-8 text-[13px] text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#9b1c1c] focus:ring-2 focus:ring-[#9b1c1c]/15"
            />
            {query && (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as Sort);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-gray-700 outline-none focus:border-[#9b1c1c] focus:ring-2 focus:ring-[#9b1c1c]/15"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name">Nama A–Z</option>
          </select>
        </div>

        {/* Bulk bar */}
        {selectedIds.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#9b1c1c]/20 bg-[#9b1c1c]/5 px-3 py-2">
            <span className="text-xs font-semibold text-[#9b1c1c]">
              {selectedIds.length} user dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busyAny}
                onClick={() => setConfirm({ kind: "bulk", ids: selectedIds, action: "approve" })}
                className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                <Check className="size-3.5" />
                Setujui
              </button>
              <button
                type="button"
                disabled={busyAny}
                onClick={() => setConfirm({ kind: "bulk", ids: selectedIds, action: "reject" })}
                className="flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                <X className="size-3.5" />
                Tolak
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="h-8 px-2 text-xs font-medium text-gray-600 hover:text-gray-800"
              >
                Batal pilih
              </button>
            </div>
          </div>
        )}

        {/* Notice */}
        {notice && (
          <div
            role="status"
            className={`mt-3 flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium ${
              notice.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setNotice(null)}
              className="opacity-70 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="mt-3 max-h-[50vh] overflow-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-160 text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua yang menunggu"
                    checked={allSelected}
                    disabled={pendingInFiltered.length === 0}
                    onChange={toggleAll}
                    className="size-4 accent-[#9b1c1c]"
                  />
                </th>
                <th className="px-4 py-2.5 font-semibold">Pengguna</th>
                {showOpd && <th className="px-4 py-2.5 font-semibold">OPD</th>}
                {showDate && <th className="px-4 py-2.5 font-semibold">Tanggal Daftar</th>}
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-10 text-center text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-10 text-center text-gray-400">
                    {emptyText}
                  </td>
                </tr>
              )}
              {pageRows.map((u) => {
                const busy = busyIds.has(u.id);
                const isPending = u.status === "pending";
                const badge = BADGE[u.status] ?? BADGE.pending;
                return (
                  <tr key={u.id} className="align-middle transition-colors hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${u.full_name}`}
                        disabled={!isPending || busy}
                        checked={isPending && selected.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        className="size-4 accent-[#9b1c1c] disabled:opacity-30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    {showOpd && <td className="px-4 py-3 text-gray-600">{u.opd_name ?? "—"}</td>}
                    {showDate && (
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {fmtDate(u.created_at)}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      {!isPending && (u.approved_at || u.approved_by_name) && (
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {u.approved_at ? fmtDate(u.approved_at) : ""}
                          {u.approved_by_name ? ` · ${u.approved_by_name}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setConfirm({ kind: "single", user: u, action: "approve" })
                              }
                              className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <Check className="size-3.5" />
                              {busy ? "Memproses..." : "Setujui"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setConfirm({ kind: "single", user: u, action: "reject" })
                              }
                              className="flex h-8 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
                            >
                              <X className="size-3.5" />
                              Tolak
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          aria-label={`Edit ${u.full_name}`}
                          title="Edit data"
                          disabled={busy}
                          onClick={() => openEdit(u)}
                          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-[#9b1c1c]/40 hover:text-[#9b1c1c] disabled:opacity-60"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${u.full_name}`}
                          title="Hapus user"
                          disabled={busy}
                          onClick={() => openDelete(u)}
                          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length} user
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 font-medium text-gray-700">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                aria-label="Halaman berikutnya"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {!fullList && (
          <p className="mt-3 text-[11px] text-gray-400">
            Riwayat disetujui/ditolak disimpan di browser ini. Tambahkan endpoint GET
            /admin/users di backend agar riwayat permanen.
          </p>
        )}
      </section>

      {/* Modal konfirmasi */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          onClick={() => setConfirm(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-gray-900">
              {confirm.kind === "bulk"
                ? confirm.action === "approve"
                  ? `Setujui ${confirm.ids.length} pendaftaran?`
                  : `Tolak ${confirm.ids.length} pendaftaran?`
                : confirm.action === "approve"
                  ? "Setujui pendaftaran?"
                  : "Tolak pendaftaran?"}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
              {confirm.kind === "bulk"
                ? confirm.action === "approve"
                  ? "User yang dipilih akan bisa masuk ke sistem dan menerima email pemberitahuan."
                  : "User yang dipilih tidak akan bisa masuk ke sistem dan menerima email pemberitahuan."
                : confirm.action === "approve"
                  ? `${confirm.user.full_name} (${confirm.user.email}) akan bisa masuk ke sistem.`
                  : `${confirm.user.full_name} (${confirm.user.email}) tidak akan bisa masuk ke sistem.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={runConfirm}
                className={`h-9 rounded-lg px-4 text-xs font-semibold text-white ${
                  confirm.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirm.action === "approve" ? "Ya, setujui" : "Ya, tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edit */}
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          onClick={() => !saving && setEditing(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Edit data user</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Perbaiki data jika user salah memasukkan informasi.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                disabled={saving}
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">Nama lengkap</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={saving}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-[#9b1c1c] focus:ring-2 focus:ring-[#9b1c1c]/15 disabled:bg-gray-50"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">Email</span>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={saving}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-[#9b1c1c] focus:ring-2 focus:ring-[#9b1c1c]/15 disabled:bg-gray-50"
                />
              </label>
            </div>

            {editError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {editError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(null)}
                className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving || !editDirty}
                onClick={saveEdit}
                className="h-9 rounded-lg bg-[#9b1c1c] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#7f1616] disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hapus */}
      {deleting && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          onClick={() => !deleteBusy && setDeleting(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="size-5 text-red-600" />
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-900">Hapus user ini?</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-800">{deleting.full_name}</span> (
              {deleting.email}) akan dihapus permanen dan tidak bisa dikembalikan.
            </p>

            {deleteError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleting(null)}
                className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={runDelete}
                className="h-9 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deleteBusy ? "Menghapus..." : "Ya, hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthBackground>
  );
}