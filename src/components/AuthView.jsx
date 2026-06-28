import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import BrandWordmark from "./BrandWordmark";
import { sendMagicLink } from "../lib/supabase";

function AuthView() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanedEmail = email.trim();
    if (!cleanedEmail || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      await sendMagicLink(cleanedEmail);
      setStatus("sent");
      setSentEmail(cleanedEmail);
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not send the sign-in link.");
    }
  }

  function handleUseDifferentEmail() {
    setEmail("");
    setStatus("idle");
    setMessage("");
    setSentEmail("");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-stone-950 dark:bg-stone-950 dark:text-stone-100 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-sm flex-col justify-center">
        <div className="mb-6 px-1">
          <BrandWordmark animateBook />
        </div>

        {status === "sent" ? (
          <div className="border-t border-stone-300/80 pt-6 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900">
                <CheckCircle2 size={20} />
              </span>
              <h1 className="text-2xl font-semibold leading-tight">Check your email</h1>
            </div>

            <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-400">
              We sent a secure sign-in link to <span className="font-semibold text-stone-900 dark:text-stone-100">{sentEmail}</span>.
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
              Open the link on this device to continue to your library.
            </p>

            <button
              className="mt-5 text-sm font-semibold text-teal-800 transition hover:text-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:text-teal-300 dark:hover:text-teal-200 dark:focus:ring-teal-950"
              onClick={handleUseDifferentEmail}
              type="button"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form className="border-t border-stone-300/80 pt-6 dark:border-stone-800" onSubmit={handleSubmit}>
            <h1 className="text-2xl font-semibold leading-tight">Sign in to shelvd</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
              No password needed. We'll email you a secure link.
            </p>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Email</span>
              <span className="relative mt-2 block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
                <input
                  className="input h-12 rounded-lg bg-white/85 pl-10 shadow-sm dark:bg-stone-900/80"
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
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200 dark:focus:ring-teal-950 dark:disabled:bg-stone-700 dark:disabled:text-stone-400"
              disabled={status === "loading"}
              type="submit"
            >
              {status === "loading" ? "Sending..." : "Continue with email"}
              <ArrowRight size={17} />
            </button>

            {message && (
              <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
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
