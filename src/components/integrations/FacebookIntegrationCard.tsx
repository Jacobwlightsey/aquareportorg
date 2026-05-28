import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ExternalLink,
  Key,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
} from "lucide-react";
export function FacebookIntegrationCard() {
  const apiKeys = useQuery(api.apiKeys.listApiKeys) ?? [];
  const generateKey = useMutation(api.apiKeys.generateApiKey);
  const revokeKey = useMutation(api.apiKeys.revokeApiKey);

  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const activeKeys = apiKeys.filter((k) => !k.revokedAt);
  const revokedKeys = apiKeys.filter((k) => !!k.revokedAt);

  async function handleGenerate() {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    try {
      const result = await generateKey({
        name: newKeyName.trim(),
        scopes: ["zapier:leads"],
      });
      setGeneratedKey(result.key);
      setNewKeyName("");
    } catch (err: any) {
      alert(err.message || "Failed to generate key");
    }
    setGenerating(false);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke(keyId: any) {
    if (!confirm("Revoke this API key? Any integrations using it will stop working.")) return;
    await revokeKey({ keyId });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Facebook / Zapier Integration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect Facebook Lead Ads via Zapier to automatically import leads.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="rounded-lg border border-border bg-muted p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Zapier Setup Instructions</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-cyan-400">1.</span>
            Generate an API key below and copy it.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-cyan-400">2.</span>
            In Zapier, create a new Zap with <strong className="text-foreground">Facebook Lead Ads</strong> as the trigger.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-cyan-400">3.</span>
            Add a <strong className="text-foreground">Webhooks by Zapier</strong> action → POST request.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-cyan-400">4.</span>
            Set the URL to: <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-cyan-400">https://groovy-basilisk-939.convex.site/api/zapier-facebook-lead</code>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-cyan-400">5.</span>
            Add header: <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-cyan-400">Authorization: Bearer YOUR_API_KEY</code>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-cyan-400">6.</span>
            Map Facebook fields: <code className="text-xs text-muted-foreground">fbLeadId</code>, <code className="text-xs text-muted-foreground">fields</code> (array with name/values).
          </li>
        </ol>
        <a
          href="https://zapier.com/apps/facebook-lead-ads/integrations/webhooks"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-400"
        >
          Open Zapier <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Generated Key Warning */}
      {generatedKey && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">Save this key — it won't be shown again!</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-secondary px-3 py-1.5 text-xs text-foreground font-mono">
                  {generatedKey}
                </code>
                <button
                  onClick={() => handleCopy(generatedKey)}
                  className="shrink-0 rounded-lg border border-border bg-secondary p-2 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={() => setGeneratedKey(null)}
                className="mt-2 text-xs text-muted-foreground hover:text-muted-foreground"
              >
                I've saved it — dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate New Key */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          API Keys
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Key name (e.g. Zapier Production)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-cyan-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !newKeyName.trim()}
            className="shrink-0 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {/* Active Keys */}
      {activeKeys.length > 0 && (
        <div className="space-y-2">
          {activeKeys.map((k) => (
            <div
              key={k._id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{k.name}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(k._creationTime).toLocaleDateString()}
                  {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(k._id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                title="Revoke key"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-muted-foreground">
            {revokedKeys.length} revoked key{revokedKeys.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-1">
            {revokedKeys.map((k) => (
              <div key={k._id} className="flex items-center justify-between rounded bg-muted px-3 py-2 opacity-50">
                <span>{k.name}</span>
                <span>Revoked {k.revokedAt ? new Date(k.revokedAt).toLocaleDateString() : ""}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
