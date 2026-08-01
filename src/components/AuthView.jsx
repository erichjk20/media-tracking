import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
} from "lucide-react";
import BrandWordmark from "./BrandWordmark";
import {
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
} from "../lib/supabase";

const MIN_PASSWORD_LENGTH = 8;

function getLoginErrorMessage(error) {
  const rawMessage = error?.message || "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Email or password not accepted. Check the details and try again.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "This email needs to be confirmed in Supabase before logging in.";
  }

  if (normalizedMessage.includes("rate limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  return rawMessage || "Could not log in.";
}

function getResetErrorMessage(error) {
  const rawMessage = error?.message || "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("rate limit")) {
    return "Too many reset emails were requested. Please wait a minute and try again.";
  }

  return rawMessage || "Could not send the reset email.";
}

function getSignupErrorMessage(error) {
  const rawMessage = error?.message || "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("already registered") || normalizedMessage.includes("already exists")) {
    return "An account already exists for this email. Try logging in instead.";
  }

  if (normalizedMessage.includes("password")) {
    return rawMessage;
  }

  if (normalizedMessage.includes("rate limit")) {
    return "Too many signup attempts. Please wait a minute and try again.";
  }

  return rawMessage || "Could not create the account.";
}

function AuthView({ isPasswordRecovery = false, onPasswordUpdated = () => {} }) {
  const [mode, setMode] = useState(isPasswordRecovery ? "recovery" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const isLoading = status === "loading";

  useEffect(() => {
    if (isPasswordRecovery) {
      setMode("recovery");
      setStatus("idle");
      setMessage("");
    }
  }, [isPasswordRecovery]);

  function resetFeedback() {
    setStatus("idle");
    setMessage("");
  }

  function showLogin() {
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    resetFeedback();
  }

  function showSignup() {
    setMode("signup");
    setPassword("");
    setConfirmPassword("");
    resetFeedback();
  }

  function showForgotPassword() {
    setMode("forgot");
    setPassword("");
    setConfirmPassword("");
    resetFeedback();
  }

  async function handleLogin(event) {
    event.preventDefault();
    const cleanedEmail = email.trim();
    if (!cleanedEmail || !password || isLoading) return;

    setStatus("loading");
    setMessage("");

    try {
      await signInWithPassword(cleanedEmail, password);
    } catch (error) {
      setStatus("error");
      setMessage(getLoginErrorMessage(error));
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    const cleanedEmail = email.trim();
    if (!cleanedEmail || isLoading) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus("error");
      setMessage(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("The passwords do not match.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const data = await signUpWithPassword(cleanedEmail, password);
      setSentEmail(cleanedEmail);

      if (data.session) return;

      setPassword("");
      setConfirmPassword("");
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setMessage(getSignupErrorMessage(error));
    }
  }

  async function handleSendReset(event) {
    event.preventDefault();
    const cleanedEmail = email.trim();
    if (!cleanedEmail || isLoading) return;

    setStatus("loading");
    setMessage("");

    try {
      await sendPasswordReset(cleanedEmail);
      setSentEmail(cleanedEmail);
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setMessage(getResetErrorMessage(error));
    }
  }

  async function handleUpdatePassword(event) {
    event.preventDefault();
    if (isLoading) return;

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setStatus("error");
      setMessage(`Use at least ${MIN_PASSWORD_LENGTH} characters for your new password.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("The new passwords do not match.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await updatePassword(newPassword);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Could not update your password.");
    }
  }

  return (
    <main className="app-screen bg-transparent px-5 py-8 text-stone-100 sm:px-6">
      <section className="auth-frame mx-auto flex w-full max-w-sm flex-col justify-center">
        <div className="mb-6 px-1">
          <BrandWordmark animateBook />
        </div>

        {mode === "login" && (
          <form className="border-t border-white/10 pt-6" onSubmit={handleLogin}>
            <h1 className="text-2xl font-semibold leading-tight">Sign in to shelvd</h1>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              Use the email and password connected to your private shelf.
            </p>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-stone-200">Email</span>
              <span className="relative mt-2 block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input
                  className="input h-12 rounded-lg bg-[#181715]/80 pl-10 shadow-sm"
                  autoComplete="email"
                  inputMode="email"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (status === "error") resetFeedback();
                  }}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  required
                />
              </span>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-stone-200">Password</span>
              <span className="relative mt-2 block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input
                  className="input h-12 rounded-lg bg-[#181715]/80 pl-10 shadow-sm"
                  autoComplete="current-password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (status === "error") resetFeedback();
                  }}
                  placeholder="Your password"
                  type="password"
                  value={password}
                  required
                />
              </span>
            </label>

            <button
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d7cec0] px-4 text-sm font-semibold text-[#141210] shadow-sm transition hover:bg-[#e6ded1] focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-wait disabled:bg-white/10 disabled:text-stone-500"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Signing in..." : "Log in"}
              <ArrowRight size={17} />
            </button>

            <button
              className="mt-4 text-sm font-semibold text-shelf-accent-soft transition hover:text-shelf-accent-bright focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
              onClick={showForgotPassword}
              type="button"
            >
              Forgot password?
            </button>

            <p className="mt-5 text-sm text-stone-400">
              New here?{" "}
              <button
                className="font-semibold text-shelf-accent-soft transition hover:text-shelf-accent-bright focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                onClick={showSignup}
                type="button"
              >
                Create an account
              </button>
            </p>

            {message && (
              <p className="mt-4 rounded-md border border-red-500/25 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200">
                {message}
              </p>
            )}
          </form>
        )}

        {mode === "signup" && (
          <form className="border-t border-white/10 pt-6" onSubmit={handleSignup}>
            {status === "sent" ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-shelf-accent-deep/15 text-shelf-accent-soft ring-1 ring-shelf-accent/20">
                    <CheckCircle2 size={20} />
                  </span>
                  <h1 className="text-2xl font-semibold leading-tight">Check your email</h1>
                </div>
                <p className="mt-4 text-sm leading-6 text-stone-400">
                  We sent a confirmation link to <span className="font-semibold text-[#eee9df]">{sentEmail}</span>.
                </p>
                <button
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-shelf-accent-soft transition hover:text-shelf-accent-bright focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                  onClick={showLogin}
                  type="button"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold leading-tight">Create account</h1>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Start a private shelf with your email and password.
                </p>

                <label className="mt-6 block">
                  <span className="text-sm font-semibold text-stone-200">Email</span>
                  <span className="relative mt-2 block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                    <input
                      className="input h-12 rounded-lg bg-[#181715]/80 pl-10 shadow-sm"
                      autoComplete="email"
                      inputMode="email"
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (status === "error") resetFeedback();
                      }}
                      placeholder="you@example.com"
                      type="email"
                      value={email}
                      required
                    />
                  </span>
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-stone-200">Password</span>
                  <span className="relative mt-2 block">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                    <input
                      className="input h-12 rounded-lg bg-[#181715]/80 pl-10 shadow-sm"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD_LENGTH}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (status === "error") resetFeedback();
                      }}
                      placeholder="At least 8 characters"
                      type="password"
                      value={password}
                      required
                    />
                  </span>
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-stone-200">Confirm password</span>
                  <span className="relative mt-2 block">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                    <input
                      className="input h-12 rounded-lg bg-[#181715]/80 pl-10 shadow-sm"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD_LENGTH}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (status === "error") resetFeedback();
                      }}
                      placeholder="Repeat password"
                      type="password"
                      value={confirmPassword}
                      required
                    />
                  </span>
                </label>

                <button
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d7cec0] px-4 text-sm font-semibold text-[#141210] shadow-sm transition hover:bg-[#e6ded1] focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-wait disabled:bg-white/10 disabled:text-stone-500"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Creating..." : "Create account"}
                  <ArrowRight size={17} />
                </button>

                <button
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-shelf-accent-soft transition hover:text-shelf-accent-bright focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                  onClick={showLogin}
                  type="button"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </button>

                {message && (
                  <p className="mt-4 rounded-md border border-red-500/25 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200">
                    {message}
                  </p>
                )}
              </>
            )}
          </form>
        )}

        {mode === "forgot" && (
          <form className="border-t border-white/10 pt-6" onSubmit={handleSendReset}>
            {status === "sent" ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-shelf-accent-deep/15 text-shelf-accent-soft ring-1 ring-shelf-accent/20">
                    <CheckCircle2 size={20} />
                  </span>
                  <h1 className="text-2xl font-semibold leading-tight">Check your email</h1>
                </div>
                <p className="mt-4 text-sm leading-6 text-stone-400">
                  If an account exists for <span className="font-semibold text-[#eee9df]">{sentEmail}</span>, Supabase will send a password reset link.
                </p>
                <button
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-shelf-accent-soft transition hover:text-shelf-accent-bright focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                  onClick={showLogin}
                  type="button"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold leading-tight">Reset password</h1>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Enter your account email and we will send a secure reset link.
                </p>

                <label className="mt-6 block">
                  <span className="text-sm font-semibold text-stone-200">Email</span>
                  <span className="relative mt-2 block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                    <input
                      className="input h-12 rounded-lg bg-[#181715]/80 pl-10 shadow-sm"
                      autoComplete="email"
                      inputMode="email"
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (status === "error") resetFeedback();
                      }}
                      placeholder="you@example.com"
                      type="email"
                      value={email}
                      required
                    />
                  </span>
                </label>

                <button
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d7cec0] px-4 text-sm font-semibold text-[#141210] shadow-sm transition hover:bg-[#e6ded1] focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-wait disabled:bg-white/10 disabled:text-stone-500"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                  <ArrowRight size={17} />
                </button>

                <button
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-shelf-accent-soft transition hover:text-shelf-accent-bright focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                  onClick={showLogin}
                  type="button"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </button>

                {message && (
                  <p className="mt-4 rounded-md border border-red-500/25 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200">
                    {message}
                  </p>
                )}
              </>
            )}
          </form>
        )}

        {mode === "recovery" && (
          <form className="border-t border-white/10 pt-6" onSubmit={handleUpdatePassword}>
            {status === "success" ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-shelf-accent-deep/15 text-shelf-accent-soft ring-1 ring-shelf-accent/20">
                    <CheckCircle2 size={20} />
                  </span>
                  <h1 className="text-2xl font-semibold leading-tight">Password updated</h1>
                </div>
                <p className="mt-4 text-sm leading-6 text-stone-400">
                  Your new password is ready. Continue to your library.
                </p>
                <button
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d7cec0] px-4 text-sm font-semibold text-[#141210] shadow-sm transition hover:bg-[#e6ded1] focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                  onClick={onPasswordUpdated}
                  type="button"
                >
                  Continue
                  <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-shelf-accent-deep/15 text-shelf-accent-soft ring-1 ring-shelf-accent/20">
                    <KeyRound size={20} />
                  </span>
                  <h1 className="text-2xl font-semibold leading-tight">Set new password</h1>
                </div>
                <p className="mt-4 text-sm leading-6 text-stone-400">
                  Choose a new password for this shelvd account.
                </p>

                <label className="mt-6 block">
                  <span className="text-sm font-semibold text-stone-200">New password</span>
                  <span className="relative mt-2 block">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                    <input
                      className="input h-12 rounded-lg bg-[#181715]/80 pl-10 shadow-sm"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD_LENGTH}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        if (status === "error") resetFeedback();
                      }}
                      placeholder="At least 8 characters"
                      type="password"
                      value={newPassword}
                      required
                    />
                  </span>
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-stone-200">Confirm password</span>
                  <span className="relative mt-2 block">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                    <input
                      className="input h-12 rounded-lg bg-[#181715]/80 pl-10 shadow-sm"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD_LENGTH}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (status === "error") resetFeedback();
                      }}
                      placeholder="Repeat new password"
                      type="password"
                      value={confirmPassword}
                      required
                    />
                  </span>
                </label>

                <button
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d7cec0] px-4 text-sm font-semibold text-[#141210] shadow-sm transition hover:bg-[#e6ded1] focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-wait disabled:bg-white/10 disabled:text-stone-500"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Updating..." : "Update password"}
                  <ArrowRight size={17} />
                </button>

                {message && (
                  <p className="mt-4 rounded-md border border-red-500/25 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200">
                    {message}
                  </p>
                )}
              </>
            )}
          </form>
        )}
      </section>
    </main>
  );
}

export default AuthView;
