import { useEffect, useState } from 'react';
import { Copy, Link2, RefreshCw } from 'lucide-react';
import { supabase } from './supabase';

const hashToken = async (token: string) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
};
export default function ClientOnboardingAdmin() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const load = async () => {
    setBusy(true); setMessage('');
    const { data, error } = await supabase.from('client_onboarding_links').select('token').eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) setMessage(error.message);
    else if (data?.token) { setUrl(window.location.href.split('#')[0] + '#onboard=' + data.token); setMessage('Your active private link is ready to copy.'); }
    setBusy(false);
  };
  useEffect(() => { void load(); }, []);
  const generate = async () => {
    setBusy(true); setMessage('');
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const token_hash = await hashToken(token);
      const { error } = await supabase.from('client_onboarding_links').update({ active: false }).eq('active', true);
      if (error) throw error;
      const { error: insertError } = await supabase.from('client_onboarding_links').insert({ token_hash, token, active: true });
      if (insertError) throw insertError;
      const base = window.location.href.split('#')[0];
      setUrl(base + '#onboard=' + token);
      setMessage('New private link created. You can copy it now or return later to retrieve it from this admin page.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not create the link.'); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setMessage('Link copied. Send it only to a client you have spoken with.'); }
    catch { setMessage('Copy was blocked by your browser. Select and copy the link below.'); }
  };
  return <div className="form-page">
    <div className="form-head"><div><small>PRIVATE CLIENT INTAKE</small><h2>Client onboarding</h2><p>Generate a private form link and send it only after a client contacts you through your website.</p></div></div>
    <section className="settings-group">
      <h3>Private onboarding link</h3>
      <p className="settings-help">The link is a secret invitation. Only its hash is stored, so if you lose the original, generate a new one.</p>
      <div className="record-stack">
        {url && <div className="setting-row"><FieldLike value={url}/><button className="save-btn" onClick={copy}><Copy size={16}/> Copy link</button></div>}
        <button className="save-btn" disabled={busy} onClick={generate}><Link2 size={16}/> {busy ? 'Working...' : url ? 'Generate new link' : 'Create private link'}</button>
        <button className="add-btn" disabled={busy} onClick={()=>void load()}><RefreshCw size={16}/> Check link status</button>
        {message && <p className="settings-help" role="status">{message}</p>}
      </div>
    </section>
    <section className="settings-group"><h3>How it works</h3><p className="settings-help">1. A client first contacts you through the website. 2. You discuss the project. 3. Copy and send this link by WhatsApp or email. 4. Their submitted details are added to Clients and Inquiries in your CRM.</p></section>
  </div>;
}
function FieldLike({value}:{value:string}) { return <input aria-label="Private onboarding link" readOnly value={value} onFocus={e=>e.currentTarget.select()} style={{flex:1,minWidth:0}}/>; }
