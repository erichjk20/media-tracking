import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import BrandWordmark from "./BrandWordmark";
import { sendMagicLink } from "../lib/supabase";

const SIGN_IN_COOLDOWN_SECONDS = 60;
const AUTH_COOLDOWN_STORAGE_KEY = "shelvd-auth-email-cooldown-until";

function getStoredCooldownUntil() {
  const storedCooldown = window.localStorage.getItem(AUTH_COOLDOWN_STORAGE_KEY);
  const cooldownUntil = Number(storedCooldown);
  return Number.isFinite(cooldownUntil) ? cooldownUntil : 0;
}

function storeCooldown(until) {
  window.localStorage.setItem(AUTH_COOLDOWN_STORAGE_KEY, String(until));
}

function getAuthErrorMessage(error) {
  const rawMessage = error?.message || "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("rate limit")) {
    return "Too many sign-in emails were requested. Please wait a minute and try again.";
  }

  if (normalizedMessage.includes("email address not authorized")) {
    return "This email is not authorized for the current Supabase test project.";
  }

  return rawMessage || "Could not send the sign-in link.";
}

function AuthView() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(getStoredCooldownUntil);
  const [now, setNow] = useState(Date.now);

  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const isSubmitDisabled = status === "loading" || cooldownRemaining > 0;

  useEffect(() => {
    if (cooldownRemaining <= 0) return undefined;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldownRemaining]);

  function startCooldown() {
    const nextCooldownUntil = Date.now() + SIGN_IN_COOLDOWN_SECONDS * 1000;
    setCooldownUntil(nextCooldownUntil);
    setNow(Date.now());
    storeCooldown(nextCooldownUntil);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanedEmail = email.trim();
    if (!cleanedEmail || isSubmitDisabled) return;

    setStatus("loading");
    setMessage("");
    startCooldown();

    try {
      await sendMagicLink(cleanedEmail);
      setStatus("sent");
      setSentEmail(cleanedEmail);
    } catch (error) {
      setStatus("error");
      setMessage(getAuthErrorMessage(error));
    }
  }

  function handleUseDifferentEmail() {
    setEmail("");
    setStatus("idle");
    setMessage("");
    setSentEmail("");
  }

  return (
    <main className="min-h-screen bg-transparent px-5 py-8 text-stone-100 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-sm flex-col justify-center">
        <div className="mb-6 px-1">
          <BrandWordmark animateBook />
        </div>

        {status === "sent" ? (
          <div className="border-t border-stone-300/80 pt-6 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-shelf-accent-deep/15 text-shelf-accent-soft ring-1 ring-shelf-accent/20">
                <CheckCircle2 size={20} />
              </span>
              <h1 className="text-2xl font-semibold leading-tight">Check your email</h1>
            </div>

            <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-400">
              We sent a secure sign-in link to <span className="font-semibold text-stone-900 dark:text-[#eee9df]">{sentEmail}</span>.
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
              Open the link on this device to continue to your library.
            </p>

            <button
              className="mt-5 text-sm font-semibold text-shelf-accent-soft transition hover:text-shelf-accent-bright focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
              onClick={handleUseDifferentEmail}
              type="button"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form className="border-t border-stone-300/80 pt-6 dark:border-white/10" onSubmit={handleSubmit}>
            <h1 className="text-2xl font-semibold leading-tight">Sign in to shelvd</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
              No password needed. We'll email you a secure link.
            </p>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Email</span>
              <span className="relative mt-2 block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
                <input
                  className="input h-12 rounded-lg bg-white/90 pl-10 shadow-sm dark:bg-[#181715]/80"
                  autoComplete="email"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  required
                />
              </span>
            </label>

            <button
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d7cec0] px-4 text-sm font-semibold text-[#141210] shadow-sm transition hover:bg-[#e6ded1] focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-stone-500"
              disabled={isSubmitDisabled}
              type="submit"
            >
              {status === "loading"
                ? "Sending..."
                : cooldownRemaining > 0
                  ? `Try again in ${cooldownRemaining}s`
                  : "Continue with email"}
              <ArrowRight size={17} />
            </button>

            {message && (
              <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-900 dark:border-red-500/25 dark:bg-red-950/30 dark:text-red-200">
                {message}
              </p>
            )}
          </form>
        )}
      </section>
    </main>
  );
}

export default AuthView;
