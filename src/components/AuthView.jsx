import { useState } from "react";
import { Library, Mail, Send } from "lucide-react";
import BrandWordmark from "./BrandWordmark";
import { sendMagicLink } from "../lib/supabase";

function AuthView() {
  const [email, setEmail] = useState("");
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
      setMessage("Check your email for a sign-in link.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not send the sign-in link.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f5] px-4 py-10 text-stone-950 dark:bg-stone-950 dark:text-stone-100 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div>
          <BrandWordmark />
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-800/80 dark:text-teal-400">
            <Library size={15} />
            Track your media without the noise
          </div>
        </div>

        <form className="mt-8 rounded-lg border border-stone-300 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900" onSubmit={handleSubmit}>
          <h1 className="text-2xl font-semibold leading-tight">Sign in to your library</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
            Enter your email and shelvd will send you a private sign-in link.
          </p>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Email</span>
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
              <input
                className="input pl-10"
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
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-teal-950 dark:disabled:bg-stone-700"
            disabled={status === "loading"}
            type="submit"
          >
            <Send size={17} />
            {status === "loading" ? "Sending..." : "Send sign-in link"}
          </button>

          {message && (
            <p className={`mt-4 rounded-md border px-3 py-2 text-sm font-medium ${
              status === "error"
                ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                : "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100"
            }`}
            >
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default AuthView;
