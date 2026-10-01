import { useEffect, useState } from 'react';
import { Copy, ExternalLink, ImagePlus, Link2, Plus, RefreshCw, Save } from 'lucide-react';
import { supabase } from './supabase';

type Preview = { id: string; client_name: string; project_description: string; preview_image_url: string; agreed_price: number; payment_url: string; token: string; status: string; client_feedback: string; created_at: string };
const money = (value: number) => 'GH₵' + Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const makeToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const hashToken = async (token: string) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export function ProjectPreviewAdmin() {
  const [rows, setRows] = useState<Preview[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ client_name: '', project_description: '', preview_image_url: '', agreed_price: '', payment_url: '' });
  const [links, setLinks] = useState<Record<string, string>>({});
  const load = async () => {
    setBusy(true); setMessage('');
    const { data, error } = await supabase.from('project_previews').select('*').order('created_at', { ascending: false });
    if (error) setMessage(error.message);
    else {
      const items = (data || []) as Preview[];
      setRows(items);
      setLinks(Object.fromEntries(items.map(item => [item.id, window.location.href.split('#')[0] + '#preview=' + item.token])));
    }
    setBusy(false);
  };
  useEffect(() => { void load(); }, []);
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const token = makeToken();
      const { error } = await supabase.from('project_previews').insert({
        ...form, agreed_price: Number(form.agreed_price || 0), token, token_hash: await hashToken(token), status: 'Preview Ready'
      });
      if (error) throw error;
      setForm({ client_name: '', project_description: '', preview_image_url: '', agreed_price: '', payment_url: '' });
      setMessage('Project preview created. Copy the private link and send it to the client.');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create preview.'); setBusy(false); }
  };
  const update = async (row: Preview, patch: Partial<Preview>) => {
    setBusy(true); setMessage('');
    const { error } = await supabase.from('project_previews').update(patch).eq('id', row.id);
    if (error) setMessage(error.message); else { setMessage('Preview updated.'); await load(); }
    setBusy(false);
  };
  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setMessage('Private preview link copied.'); }
    catch { setMessage('Copy was blocked. Tap and hold the link to copy it.'); }
  };
  return <div className="form-page">
    <div className="form-head"><div><small>CLIENT PROJECTS</small><h2>Project Preview</h2><p>Create a private page where a client can review a design and respond.</p></div><button className="add-btn" onClick={() => void load()}><RefreshCw size={16}/> Refresh</button></div>
    <section className="settings-group">
      <h3>Create a project preview</h3>
      <p className="settings-help">Add the client's name, project details, preview image, and agreed price. The generated link is private, but anyone who has it can open the preview.</p>
      <form onSubmit={create} className="record-stack">
        <label className="field"><span>Client name</span><input required maxLength={160} value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})}/></label>
        <label className="field"><span>Project description</span><textarea required rows={3} value={form.project_description} onChange={e=>setForm({...form,project_description:e.target.value})}/></label>
        <label className="field"><span>Preview image URL</span><input type="url" required placeholder="https://..." value={form.preview_image_url} onChange={e=>setForm({...form,preview_image_url:e.target.value})}/></label>
        <label className="field"><span>Agreed price (GHS)</span><input type="number" min="0" step="0.01" value={form.agreed_price} onChange={e=>setForm({...form,agreed_price:e.target.value})}/></label>
        <label className="field"><span>Payment link (optional)</span><input type="url" placeholder="https://..." value={form.payment_url} onChange={e=>setForm({...form,payment_url:e.target.value})}/></label>
        <button className="save-btn" disabled={busy}><Plus size={16}/> {busy ? 'Creating...' : 'Create preview link'}</button>
      </form>
    </section>
    {message && <p className="settings-help" role="status">{message}</p>}
    <section className="settings-group"><h3>Existing previews</h3>
      {!rows.length && !busy && <p className="settings-help">No project previews yet.</p>}
      <div className="record-stack">{rows.map(row=><article className="record-card" key={row.id}>
        <div className="record-title"><strong>{row.client_name}</strong><span>{row.status}</span></div>
        {row.preview_image_url && <img src={row.preview_image_url} alt={'Preview for '+row.client_name} style={{width:'100%',maxHeight:240,objectFit:'contain',borderRadius:12,background:'#f1f5f9'}}/>}
        <p>{row.project_description}</p><p><b>{money(row.agreed_price)}</b></p>
        <label className="field"><span>Status</span><select value={row.status} onChange={e=>void update(row,{status:e.target.value})}>{['Preview Ready','Approved - Payment Pending','Changes Requested','Not Approved','Paid'].map(s=><option key={s}>{s}</option>)}</select></label>
        {row.client_feedback && <p className="settings-help">Client response: {row.client_feedback}</p>}
        <div className="setting-row"><input aria-label="Private project preview link" readOnly value={links[row.id]||''} onFocus={e=>e.currentTarget.select()} style={{flex:1,minWidth:0}}/><button className="save-btn" onClick={()=>void copy(links[row.id]||'')}><Copy size={16}/> Copy link</button><a className="add-btn" href={links[row.id]} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Open</a></div>
      </article>)}</div>
    </section>
  </div>;
}

export function PublicProjectPreview({ token }: { token: string }) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.functions.invoke('project-preview', { body: { token, action: 'get' } }).then(({data,error}) => {
      if (error || data?.error) setError(data?.error || 'This preview could not be loaded.');
      else setPreview(data.preview);
      setLoading(false);
    }).catch(()=>{setError('This preview could not be loaded.');setLoading(false);});
  }, [token]);
  const respond = async (action: string) => {
    if (action !== 'approve' && !feedback.trim()) { setError('Please add a short note so Wycliffe knows what you want.'); return; }
    setBusy(true);setError('');
    const {data,error}=await supabase.functions.invoke('project-preview',{body:{token,action,feedback}});
    if(error||data?.error)setError(data?.error||'Your response could not be saved.');
    else {setPreview({...preview,status:data.status,client_feedback:feedback});}
    setBusy(false);
  };
  if(loading)return <div className="preview-public"><p>Loading your project preview...</p></div>;
  if(error&&!preview)return <div className="preview-public"><h1>Project preview unavailable</h1><p>{error}</p></div>;
  return <main className="preview-public">
    <div className="preview-public-card"><small>WYCLIFFE STUDIOS / PROJECT PREVIEW</small><h1>Your design is ready, {preview.client_name}.</h1><p>{preview.project_description}</p>
      {preview.preview_image_url&&<img src={preview.preview_image_url} alt="Your project design preview"/>}
      <div className="preview-price"><span>Agreed project price</span><strong>{money(preview.agreed_price)}</strong></div>
      <p className="preview-status">Current status: <b>{preview.status}</b></p>
      {preview.status==='Preview Ready' ? <><div className="preview-actions"><button disabled={busy} onClick={()=>void respond('approve')}>Approve &amp; Pay</button><button disabled={busy} onClick={()=>void respond('request_changes')}>Request Changes</button><button disabled={busy} onClick={()=>void respond('reject')}>I Don't Like It</button></div><label className="field"><span>Notes (required for changes or rejection)</span><textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Tell me what you would like changed..."/></label></> : <p>Thank you. Your response has been recorded. Wycliffe will follow up with you.</p>}
      {preview.status==='Approved - Payment Pending'&&preview.payment_url&&<a className="preview-pay" href={preview.payment_url} target="_blank" rel="noreferrer">Continue to payment</a>}
      {error&&<p role="alert" className="crm-error">{error}</p>}
      <small className="preview-footnote">Your response is saved on this page. Payment is only confirmed after Wycliffe verifies it.</small>
    </div>
    <style>{`.preview-public{min-height:100vh;padding:28px 16px;background:#f4f6f9;color:#0B0F19;display:grid;place-items:center;font-family:inherit}.preview-public-card{width:min(760px,100%);padding:clamp(20px,5vw,44px);border:1px solid #dce5ee;border-radius:20px;background:#fff;box-shadow:0 16px 48px #0b0f1910}.preview-public-card>small:first-child{color:#3B9BE0;font-size:11px;letter-spacing:.14em;font-weight:700}.preview-public-card h1{font-size:clamp(26px,5vw,42px);margin:14px 0}.preview-public-card p{line-height:1.6;color:#5C6270}.preview-public-card>img{display:block;width:100%;max-height:70vh;object-fit:contain;background:#f3f5f7;border-radius:14px;margin:22px 0}.preview-price{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid #e7edf3}.preview-price span{color:#5C6270}.preview-price strong{font-size:24px}.preview-status{font-size:14px}.preview-actions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.preview-actions button,.preview-pay{border:0;border-radius:10px;padding:12px 16px;background:#2477d4;color:white;font-weight:600;cursor:pointer;text-decoration:none}.preview-actions button:nth-child(2){background:#e8f3fd;color:#176eb6}.preview-actions button:nth-child(3){background:#f4e9e9;color:#9b3434}.preview-actions button:disabled{opacity:.6}.preview-footnote{display:block;margin-top:22px;color:#718096;font-size:12px;line-height:1.5}`}</style>
  </main>;
}
