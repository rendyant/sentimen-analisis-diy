"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthBackground from "@/features/register/components/AuthBackground";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const REDIRECT: Record<string, string> = {
  admin: "/admin",
  opd: "/dashboard",
};

type FormData = {
  email: string;
  password: string;
  ingat: boolean;
};

type Errors = Partial<Record<keyof FormData, string>>;

const inputBase =
  "h-9 w-full rounded-lg border bg-white pl-9 pr-3 text-[13px] font-normal text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#9b1c1c] focus:ring-2 focus:ring-[#9b1c1c]/15";
const labelBase = "mb-1 block text-xs font-medium text-gray-700";
const errorText = "mt-0.5 text-[11px] font-medium text-red-600";
const iconLeft =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400";
const iconRight =
  "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ email: "", password: "", ingat: false });
  const [errors, setErrors] = useState<Errors>({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState("");

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.email.trim()) e.email = "Email wajib diisi";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Format email tidak valid";
    if (!form.password) e.password = "Kata sandi wajib diisi";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerMsg("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        throw new Error("Terlalu banyak percobaan. Coba lagi beberapa saat.");
      }
      if (!res.ok) {
        const detail = data.detail;
        const msg = Array.isArray(detail)
          ? String(detail[0]?.msg ?? "").replace("Value error, ", "")
          : detail;
        throw new Error(msg || "Login gagal");
      }

      const store = form.ingat ? localStorage : sessionStorage;
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user");
      store.setItem("access_token", data.access_token);
      store.setItem("user", JSON.stringify(data.user));

      router.push(REDIRECT[data.user?.role] ?? "/dashboard");
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

  return (
    <AuthBackground>
      <div className="flex w-full flex-col items-center gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold leading-none tracking-tight text-[#9b1c1c]">
            LOGIN
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase text-slate-800">
            Analisis Sentimen Pelayanan Publik
          </p>
          <p className="mx-auto mt-1.5 max-w-xl text-[13px] leading-relaxed text-gray-600">
            Masuk untuk memantau dan menganalisis sentimen pelayanan publik pada setiap
            instansi Organisasi Perangkat Daerah (OPD) DIY.
          </p>
        </div>

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

          <form onSubmit={handleSubmit} noValidate className="mt-4 grid gap-2.5">
            <div>
              <label htmlFor="email" className={labelBase}>
                Alamat Email
              </label>
              <div className="relative">
                <Mail className={iconLeft} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="nama@jogjaprov.go.id"
                  className={`${inputBase} ${border("email")}`}
                />
              </div>
              {errors.email && <p className={errorText}>{errors.email}</p>}
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
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Masukkan kata sandi"
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

            <label className="flex items-center gap-2 text-xs font-normal text-gray-600">
              <input
                type="checkbox"
                checked={form.ingat}
                onChange={(e) => setField("ingat", e.target.checked)}
                className="size-4 rounded border-gray-300 accent-[#8f1111]"
              />
              Ingat Saya
            </label>

            {serverMsg && (
              <p className="text-center text-xs font-medium text-red-600">{serverMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-lg bg-[#8f1111] text-[13px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#7a0e0e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk Sistem"}
            </button>

            <div className="border-t border-gray-200 pt-2.5 text-center text-[13px] font-normal text-gray-600">
              Belum memiliki akun?{" "}
              <Link href="/register" className="font-semibold text-[#9b1c1c]">
                Daftar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </AuthBackground>
  );
}