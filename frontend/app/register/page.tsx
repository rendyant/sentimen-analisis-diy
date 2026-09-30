"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Mail, Briefcase, Lock, Eye, EyeOff, ChevronDown } from "lucide-react";
import AuthBackground from "@/features/register/components/AuthBackground";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Opd = { id: string; name: string; slug: string };
type OpdStatus = "loading" | "ok" | "error";

type FormData = {
  nama: string;
  email: string;
  opd: string;
  password: string;
  konfirmasi: string;
  setuju: boolean;
};

type Errors = Partial<Record<keyof FormData, string>>;

const initialForm: FormData = {
  nama: "",
  email: "",
  opd: "",
  password: "",
  konfirmasi: "",
  setuju: false,
};

const inputBase =
  "h-9 w-full rounded-lg border bg-white pl-9 pr-3 text-[13px] font-normal text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#9b1c1c] focus:ring-2 focus:ring-[#9b1c1c]/15";
const labelBase = "mb-1 block text-xs font-medium text-gray-700";
const errorText = "mt-0.5 text-[11px] font-medium text-red-600";
const iconLeft =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400";
const iconRight =
  "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600";

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [serverOk, setServerOk] = useState(false);
  const [opdList, setOpdList] = useState<Opd[]>([]);
  const [opdStatus, setOpdStatus] = useState<OpdStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadOpd() {
      try {
        const res = await fetch(`${API}/opd`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error("Format data OPD tidak valid");
        if (!cancelled) {
          setOpdList(data as Opd[]);
          setOpdStatus("ok");
        }
      } catch (err) {
        console.error("Gagal memuat OPD dari", `${API}/opd`, err);
        if (!cancelled) setOpdStatus("error");
      }
    }

    loadOpd();
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (form.nama.trim().length < 3) e.nama = "Nama lengkap minimal 3 karakter";
    if (!form.email.trim()) e.email = "Email wajib diisi";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Format email tidak valid";
    if (!form.opd) e.opd = "OPD wajib dipilih";
    if (form.password.length < 8) e.password = "Kata sandi minimal 8 karakter";
    else if (!/\d/.test(form.password)) e.password = "Kata sandi harus mengandung minimal satu angka";
    if (form.konfirmasi !== form.password) e.konfirmasi = "Konfirmasi kata sandi tidak sama";
    if (!form.setuju) e.setuju = "Anda harus menyetujui syarat dan ketentuan";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerMsg("");
    setServerOk(false);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.nama.trim(),
          email: form.email.trim(),
          opd_id: form.opd,
          password: form.password,
          konfirmasi_password: form.konfirmasi,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.detail;
        const msg = Array.isArray(detail)
          ? String(detail[0]?.msg ?? "").replace("Value error, ", "")
          : detail;
        throw new Error(msg || "Pendaftaran gagal");
      }
      setForm(initialForm);
      setServerOk(true);
      setServerMsg("Pendaftaran berhasil. Akun Anda menunggu persetujuan admin sebelum bisa masuk.");
    } catch (err) {
      if (err instanceof TypeError) {
        setServerMsg("Tidak dapat terhubung ke server. Coba lagi beberapa saat.");
      } else {
        setServerMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
      }
    } finally {
      setLoading(false);
    }
  }

  const border = (k: keyof FormData) => (errors[k] ? "border-red-500" : "border-gray-200");

  const opdPlaceholder =
    opdStatus === "loading"
      ? "Memuat daftar OPD..."
      : opdStatus === "error"
        ? "Daftar OPD tidak dapat dimuat"
        : "Pilih OPD";

  return (
    <AuthBackground>
      <section className="w-full max-w-130 rounded-2xl border border-gray-200 bg-white px-7 py-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <header className="flex flex-col items-center text-center">
          <Image
            src="/images/Logo(2).png"
            alt="Logo Pemerintah Daerah DIY"
            width={44}
            height={50}
            priority
            className="h-11 w-auto"
          />
          <h2 className="mt-2 text-xl font-bold leading-tight tracking-tight text-[#9b1c1c]">
            SENTIMEN ANALISIS DIY
          </h2>
          <div className="mt-2 h-px w-30 bg-[#e5b4b4]" />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Sistem Otentikasi
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-4 grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label htmlFor="nama" className={labelBase}>
              Nama Lengkap
            </label>
            <div className="relative">
              <User className={iconLeft} />
              <input
                id="nama"
                type="text"
                value={form.nama}
                onChange={(e) => setField("nama", e.target.value)}
                placeholder="Masukkan nama lengkap"
                className={`${inputBase} ${border("nama")}`}
              />
            </div>
            {errors.nama && <p className={errorText}>{errors.nama}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className={labelBase}>
              Alamat Email
            </label>
            <div className="relative">
              <Mail className={iconLeft} />
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="nama@jogjaprov.go.id"
                className={`${inputBase} ${border("email")}`}
              />
            </div>
            {errors.email && <p className={errorText}>{errors.email}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="opd" className={labelBase}>
              OPD (Organisasi Perangkat Daerah)
            </label>
            <div className="relative">
              <Briefcase className={iconLeft} />
              <select
                id="opd"
                value={form.opd}
                onChange={(e) => setField("opd", e.target.value)}
                className={`${inputBase} ${border("opd")} appearance-none pr-10 ${
                  form.opd ? "" : "text-gray-400"
                }`}
              >
                <option value="">{opdPlaceholder}</option>
                {opdList.map((o) => (
                  <option key={o.id} value={o.id} className="text-gray-800">
                    {o.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.opd && <p className={errorText}>{errors.opd}</p>}
          </div>

          <div>
            <label htmlFor="password" className={labelBase}>
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className={iconLeft} />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="Minimal 8 karakter"
                className={`${inputBase} ${border("password")} pr-9`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className={iconRight}
              >
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className={errorText}>{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="konfirmasi" className={labelBase}>
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <Lock className={iconLeft} />
              <input
                id="konfirmasi"
                type={showConfirm ? "text" : "password"}
                value={form.konfirmasi}
                onChange={(e) => setField("konfirmasi", e.target.value)}
                placeholder="Ulangi kata sandi"
                className={`${inputBase} ${border("konfirmasi")} pr-9`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
                className={iconRight}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.konfirmasi && <p className={errorText}>{errors.konfirmasi}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-xs font-normal text-gray-600">
              <input
                type="checkbox"
                checked={form.setuju}
                onChange={(e) => setField("setuju", e.target.checked)}
                className="size-4 rounded border-gray-300 accent-[#8f1111]"
              />
              <span>
                Saya menyetujui{" "}
                <Link href="#" className="font-semibold text-[#9b1c1c]">
                  syarat dan ketentuan
                </Link>{" "}
                yang berlaku.
              </span>
            </label>
            {errors.setuju && <p className={errorText}>{errors.setuju}</p>}
          </div>

          {serverMsg && (
            <p
              className={`sm:col-span-2 text-center text-xs font-medium ${
                serverOk ? "text-green-700" : "text-red-600"
              }`}
            >
              {serverMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 h-10 rounded-lg bg-[#8f1111] text-[13px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#7a0e0e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Daftar sebagai User OPD"}
          </button>

          <div className="sm:col-span-2 border-t border-gray-200 pt-2.5 text-center text-[13px] font-normal text-gray-600">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="font-semibold text-[#9b1c1c]">
              Masuk
            </Link>
          </div>
        </form>
      </section>
    </AuthBackground>
  );
}