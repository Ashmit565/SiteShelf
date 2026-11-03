import { ArrowUpRight, Globe2, Trash2 } from "lucide-react";
import React, { useState } from "react";

export default function WebsiteCard({ website, onDelete }) {
  const previewTitle = website.title || website.domain;
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="website-card">
      <div className="card-preview">
        {website.image_url && !imageFailed ? (
          <img src={website.image_url} alt="" loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <div className="preview-fallback"><Globe2 size={26} strokeWidth={1.4} /><span>{website.domain}</span></div>
        )}
        <a className="preview-open" href={website.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${website.domain} in a new tab`}>
          <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="card-content">
        <div className="card-domain"><span className="domain-dot" />{website.domain}</div>
        <h3 title={previewTitle}>{previewTitle}</h3>
        <p title={website.description || website.url}>{website.description || website.url}</p>
        <div className="card-footer">
          <a href={website.url} target="_blank" rel="noopener noreferrer">Visit website <ArrowUpRight size={14} /></a>
          <button type="button" className="icon-button delete-button" onClick={() => onDelete(website)} aria-label={`Delete ${website.domain}`} title="Remove from collection">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
