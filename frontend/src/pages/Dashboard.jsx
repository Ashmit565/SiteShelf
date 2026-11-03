import { ArrowRight, Bookmark, Check, Globe2, LogOut, Plus, Search, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import WebsiteCard from "../components/WebsiteCard";
import { apiRequest, clearToken } from "../services/api";

export default function Dashboard({ user, onLogout }) {
  const [url, setUrl] = useState("");
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiRequest("/websites")
      .then(setWebsites)
      .catch((error) => {
        if (error.message.toLowerCase().includes("sign in")) {
          clearToken();
          onLogout();
        } else setMessage({ type: "error", text: error.message });
      })
      .finally(() => setLoading(false));
  }, [onLogout]);

  async function addWebsite(event) {
    event.preventDefault();
    setMessage(null);
    setAdding(true);
    try {
      const website = await apiRequest("/websites", { method: "POST", body: { url: url.trim() } });
      setWebsites((items) => [website, ...items]);
      setUrl("");
      setMessage({ type: "success", text: "Website added to your collection." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setAdding(false);
    }
  }

  async function deleteWebsite(website) {
    setMessage(null);
    try {
      await apiRequest(`/websites/${website.id}`, { method: "DELETE" });
      setWebsites((items) => items.filter((item) => item.id !== website.id));
      setMessage({ type: "success", text: "Website removed from your collection." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  const filtered = websites.filter((site) => `${site.domain} ${site.title || ""} ${site.url}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-icon"><Bookmark size={17} fill="currentColor" /></span><span>siteshelf</span></a>
        <div className="topbar-right">
          <span className="user-greeting">Your collection, {user.name.split(" ")[0]}</span>
          <button className="button button-quiet" onClick={onLogout}><LogOut size={15} /> <span>Sign out</span></button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-row">
          <div>
            <div className="eyebrow eyebrow-dark"><Sparkles size={13} /> YOUR PERSONAL WEB LIBRARY</div>
            <h1>Keep the good <em>ones.</em></h1>
            <p>A home for all the pages worth coming back to.</p>
          </div>
          <div className="collection-count"><span>{websites.length.toString().padStart(2, "0")}</span><small>SAVED<br />SITES</small></div>
        </section>

        <section className="add-panel">
          <div className="add-heading"><div className="add-icon"><Plus size={17} /></div><div><h2>Add to your shelf</h2><p>Paste a URL and we’ll make a tidy preview for you.</p></div></div>
          <form className="add-form" onSubmit={addWebsite}>
            <div className="url-input-wrap"><Globe2 size={17} /><input type="url" required placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} aria-label="Website URL" /></div>
            <button className="button button-dark add-button" type="submit" disabled={adding}>{adding ? <><span className="spinner" /> Saving...</> : <>Add website <ArrowRight size={16} /></>}</button>
          </form>
          {message && <div className={`alert alert-${message.type}`} role="status">{message.type === "success" && <Check size={15} />}{message.text}</div>}
        </section>

        <section className="collection-section">
          <div className="section-heading">
            <div><h2>Your saved websites</h2><p>{websites.length ? `${websites.length} ${websites.length === 1 ? "page" : "pages"} in your collection` : "Your collection starts here"}</p></div>
            {websites.length > 0 && <label className="search-box"><Search size={16} /><input placeholder="Find a website..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search saved websites" /></label>}
          </div>
          {loading ? (
            <div className="loading-state"><span className="spinner spinner-dark" /> Loading your collection...</div>
          ) : websites.length === 0 ? (
            <div className="empty-state"><div className="empty-art"><Bookmark size={25} /><span><Plus size={13} /></span></div><h3>Your shelf is looking a little empty</h3><p>Paste a website URL above and your first saved page will land here.</p><span className="empty-hint">TIP <ArrowRight size={12} /> Try saving an article, a tool, or a place you love.</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-search">No saved websites match “{query}”.</div>
          ) : (
            <div className="website-grid">{filtered.map((website) => <WebsiteCard key={website.id} website={website} onDelete={deleteWebsite} />)}</div>
          )}
        </section>
        <footer className="dashboard-footer"><span>siteshelf</span><span>Keep what inspires you.</span></footer>
      </main>
    </div>
  );
}
