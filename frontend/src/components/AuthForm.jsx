import { ArrowRight, Bookmark, Globe2, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { apiRequest, saveToken } from "../services/api";

export default function AuthForm({ mode, onAuthenticated, onModeChange }) {
  const isSignup = mode === "signup";
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await apiRequest(`/auth/${mode}`, {
        method: "POST",
        auth: false,
        body: values,
      });
      saveToken(data.access_token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-aside">
        <a className="brand brand-light" href="/">
          <span className="brand-icon"><Bookmark size={18} fill="currentColor" /></span>
          <span>siteshelf</span>
        </a>
        <div className="aside-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL WEB LIBRARY</div>
          <h1>Good finds<br />deserve a <em>home.</em></h1>
          <p>Save the websites you love. Come back to them whenever you need.</p>
        </div>
        <div className="aside-note"><Globe2 size={16} /> A little more organized, every day.</div>
        <div className="aside-orbit orbit-one" /><div className="aside-orbit orbit-two" />
      </section>
      <section className="auth-main">
        <div className="auth-form-wrap">
          <span className="form-kicker">{isSignup ? "START YOUR COLLECTION" : "WELCOME BACK"}</span>
          <h2>{isSignup ? "Create your account" : "Sign in to SiteShelf"}</h2>
          <p className="form-intro">{isSignup ? "It takes just a moment to get started." : "Your saved corners of the internet are waiting."}</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <form onSubmit={submit}>
            {isSignup && (
              <label className="field">
                <span>Your name</span>
                <input autoComplete="name" required maxLength={120} placeholder="e.g. Alex Morgan" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input type="email" autoComplete="email" required placeholder="you@example.com" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" autoComplete={isSignup ? "new-password" : "current-password"} required minLength={isSignup ? 8 : 1} placeholder={isSignup ? "At least 8 characters" : "Enter your password"} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
            </label>
            <button className="button button-dark auth-submit" type="submit" disabled={busy}>
              {busy ? "One moment..." : isSignup ? "Create account" : "Sign in"}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "New to SiteShelf?"}{" "}
            <button type="button" onClick={() => { setError(""); onModeChange(isSignup ? "login" : "signup"); }}>
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
          <div className="auth-foot">Your personal collection, always within reach.</div>
        </div>
      </section>
    </main>
  );
}
