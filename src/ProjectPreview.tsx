import { useEffect, useState } from 'react';
import { Copy, ExternalLink, ImagePlus, Link2, Plus, RefreshCw, Save } from 'lucide-react';
import { supabase } from './supabase';

type Preview = { id: string; client_name: string; project_description: string; preview_image_url: string; media_type?: string; agreed_price: number; payment_url: string; token: string; status: string; client_feedback: string; created_at: string };
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
  const [form, setForm] = useState({ client_name: '', project_description: '', preview_image_url: '', media_type: '', agreed_price: '', payment_url: '' });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
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
      let mediaUrl = form.preview_image_url;
      let mediaType = form.media_type;
      if (mediaFile) {
        const safeName = mediaFile.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-100);
        const path = 'editor/project-previews/' + crypto.randomUUID() + '-' + safeName;
        const upload = await supabase.storage.from('site-images').upload(path, mediaFile, { cacheControl: '3600', upsert: false, contentType: mediaFile.type || undefined });
        if (upload.error) throw upload.error;
        mediaUrl = supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl;
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }
      if (!mediaUrl) throw new Error('Please upload a preview file first.');
      const { error } = await supabase.from('project_previews').insert({
        ...form, preview_image_url: mediaUrl, media_type: mediaType || 'image', agreed_price: Number(form.agreed_price || 0), token, token_hash: await hashToken(token), status: 'Preview Ready'
      });
      if (error) throw error;
      setForm({ client_name: '', project_description: '', preview_image_url: '', media_type: '', agreed_price: '', payment_url: '' });
      setMediaFile(null);
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
      <p className="settings-help">Add the client's name, project details, upload the actual design file (images or video), and enter the agreed price. The generated link is private, but anyone who has it can open the preview.</p>
      <form onSubmit={create} className="record-stack">
        <label className="field"><span>Client name</span><input required maxLength={160} value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})}/></label>
        <label className="field"><span>Project description</span><textarea required rows={3} value={form.project_description} onChange={e=>setForm({...form,project_description:e.target.value})}/></label>
        <label className="field"><span>Upload preview file (image or video)</span><input type="file" required accept="image/*,video/*" onChange={e=>setMediaFile(e.target.files?.[0] || null)}/>{mediaFile && <small>{mediaFile.name} · {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB</small>}</label>
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
        {row.preview_image_url && (row.media_type === 'video' ? <video src={row.preview_image_url} controls playsInline style={{width:'100%',maxHeight:300,borderRadius:12,background:'#f1f5f9'}}/> : <img src={row.preview_image_url} alt={'Preview for '+row.client_name} style={{width:'100%',maxHeight:240,objectFit:'contain',borderRadius:12,background:'#f1f5f9'}}/>)}
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
  if(loading)return <main className="preview-public"><div className="preview-public-card preview-message"><p>Loading your project preview...</p></div></main>;
  if(error&&!preview)return <main className="preview-public"><div className="preview-public-card preview-message"><h1>Project preview unavailable</h1><p>{error}</p></div></main>;
  const isVideo = preview.media_type === 'video';
  const responded = preview.status !== 'Preview Ready';
  return <main className="preview-public">
    <div className="preview-shell">
      <header className="preview-header">
        <div className="preview-brand"><span className="preview-brand-mark">W</span><span><strong>Wycliffe Studios</strong><small>DESIGN PREVIEW</small></span></div>
        <span className="preview-secure"><span className="preview-secure-dot"/>{responded ? 'Response received' : 'Private client preview'}</span>
      </header>
      <section className="preview-intro">
        <div><span className="preview-eyebrow">YOUR PROJECT</span><h1>Take a look at your design, {preview.client_name}.</h1><p>Review the preview below. You can approve it or let me know what you'd like changed.</p></div>
        <span className={'preview-status-pill ' + (responded ? 'is-responded' : '')}>{preview.status}</span>
      </section>
      <section className="preview-layout">
        <div className="preview-media-panel">
          <div className="preview-media-heading"><span>Design preview</span><small>{isVideo ? 'VIDEO' : 'IMAGE'}</small></div>
          <div className="preview-media">
            {preview.preview_image_url && (isVideo ? <video src={preview.preview_image_url} controls playsInline aria-label="Your project design preview"/> : <img src={preview.preview_image_url} alt="Your project design preview"/>)}
          </div>
        </div>
        <aside className="preview-details">
          <span className="preview-eyebrow">PROJECT DETAILS</span>
          <h2>{preview.project_description}</h2>
          <div className="preview-price"><span>Agreed project price</span><strong>{money(preview.agreed_price)}</strong></div>
          {preview.status === 'Preview Ready' ? <>
            <p className="preview-instruction">Happy with the design? Approve it to continue. Need a change? Leave a note and send your request.</p>
            <label className="preview-feedback"><span>Message to the designer <small>(needed for changes or rejection)</small></span><textarea rows={4} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Write your feedback here..."/></label>
            <div className="preview-actions">
              <button className="preview-approve" disabled={busy} onClick={()=>void respond('approve')}>{busy?'Saving...':'Approve design'}</button>
              <button className="preview-change" disabled={busy} onClick={()=>void respond('request_changes')}>Request changes</button>
              <button className="preview-reject" disabled={busy} onClick={()=>void respond('reject')}>I don't like it</button>
            </div>
          </> : <>
            <div className="preview-response"><span className="preview-response-check">✓</span><div><strong>Your response has been recorded</strong><p>Wycliffe will follow up with you about the next step.</p></div></div>
            {preview.client_feedback && <div className="preview-saved-feedback"><strong>Your note</strong><p>{preview.client_feedback}</p></div>}
            {preview.status === 'Approved - Payment Pending' && preview.payment_url && <a className="preview-pay" href={preview.payment_url} target="_blank" rel="noreferrer">Continue to payment</a>}
          </>}
          {error&&<p role="alert" className="preview-error">{error}</p>}
          <p className="preview-footnote">Payment is only confirmed after Wycliffe verifies it. Final files are shared after payment is confirmed.</p>
        </aside>
      </section>
      <footer className="preview-footer"><span>Wycliffe Studios</span><span>Questions? Contact your designer directly.</span></footer>
    </div>
    <style>{`.preview-public{min-height:100vh;padding:32px 18px;background:radial-gradient(circle at 10% 0%,rgba(59,155,224,.08),transparent 28rem),#f4f6f9;color:#0B0F19;display:block;font-family:inherit}.preview-shell{width:min(1120px,100%);margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:22px;box-shadow:0 18px 55px rgba(11,15,25,.07);overflow:hidden}.preview-header{min-height:74px;padding:14px clamp(18px,3vw,34px);display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #edf0f4}.preview-brand{display:flex;align-items:center;gap:10px}.preview-brand-mark{width:38px;height:38px;border:1px solid #3B9BE0;border-radius:12px;display:grid;place-items:center;color:#2477d4;font-weight:800}.preview-brand strong,.preview-brand small{display:block}.preview-brand strong{font-size:14px}.preview-brand small{margin-top:3px;font-size:9px;letter-spacing:.14em;color:#718096}.preview-secure{display:flex;align-items:center;gap:7px;color:#4d6478;font-size:12px;font-weight:600}.preview-secure-dot{width:7px;height:7px;border-radius:50%;background:#3b9b70}.preview-intro{padding:clamp(24px,4vw,42px) clamp(18px,3vw,34px) 24px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px}.preview-eyebrow{font-size:10px;letter-spacing:.15em;font-weight:800;color:#2477d4}.preview-intro h1{font-size:clamp(25px,3.5vw,38px);line-height:1.15;letter-spacing:-.035em;margin:9px 0 8px;max-width:720px}.preview-intro p{margin:0;color:#667085;font-size:14px;line-height:1.6}.preview-status-pill{flex:0 0 auto;padding:8px 11px;border-radius:999px;background:#edf6ff;color:#246ca8;font-size:11px;font-weight:700}.preview-status-pill.is-responded{background:#edf8f1;color:#28734c}.preview-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.8fr);gap:clamp(18px,3vw,32px);padding:0 clamp(18px,3vw,34px) 30px;align-items:start}.preview-media-panel{min-width:0;border:1px solid #e7ebf0;border-radius:15px;background:#f7f8fa;overflow:hidden}.preview-media-heading{height:48px;padding:0 15px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e7ebf0;font-size:12px;font-weight:700}.preview-media-heading small{font-size:9px;letter-spacing:.12em;color:#8290a0}.preview-media{min-height:250px;padding:14px;display:flex;align-items:center;justify-content:center}.preview-media img,.preview-media video{display:block;width:100%;max-height:68vh;object-fit:contain;border-radius:8px}.preview-details{min-width:0;padding:5px 0}.preview-details h2{font-size:19px;line-height:1.4;font-weight:600;margin:10px 0 20px;overflow-wrap:anywhere}.preview-price{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px 0;border-top:1px solid #edf0f4;border-bottom:1px solid #edf0f4}.preview-price span{font-size:12px;color:#667085}.preview-price strong{font-size:22px;white-space:nowrap}.preview-instruction{font-size:12px;line-height:1.6;color:#667085;margin:17px 0}.preview-feedback{display:grid;gap:7px;margin:16px 0}.preview-feedback>span{font-size:11px;font-weight:700}.preview-feedback>span small{font-weight:400;color:#7b8794}.preview-feedback textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:90px;border:1px solid #dce2ea;border-radius:10px;padding:11px 12px;font:inherit;font-size:13px;color:#0B0F19;outline:none}.preview-feedback textarea:focus{border-color:#3B9BE0;box-shadow:0 0 0 3px rgba(59,155,224,.12)}.preview-actions{display:grid;gap:9px;margin-top:14px}.preview-actions button,.preview-pay{width:100%;min-height:44px;padding:11px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;text-align:center;box-sizing:border-box}.preview-approve,.preview-pay{background:#1769aa;color:#fff}.preview-change{background:#edf6ff;color:#1769aa;border:1px solid #d5e9fb!important}.preview-reject{background:#fff;color:#7b5252;border:1px solid #eadede!important}.preview-actions button:disabled{opacity:.6;cursor:wait}.preview-response{display:flex;gap:10px;align-items:flex-start;margin:18px 0;padding:13px;border:1px solid #d9eee2;border-radius:11px;background:#f3fbf6}.preview-response-check{width:23px;height:23px;flex:0 0 auto;border-radius:50%;display:grid;place-items:center;background:#d7f0e0;color:#28734c;font-size:13px;font-weight:800}.preview-response strong{font-size:12px}.preview-response p,.preview-saved-feedback p{margin:5px 0 0;font-size:12px;line-height:1.5;color:#667085}.preview-saved-feedback{padding:12px 0;border-bottom:1px solid #edf0f4}.preview-saved-feedback strong{font-size:11px}.preview-pay{display:flex;align-items:center;justify-content:center;margin-top:16px;text-decoration:none}.preview-error{font-size:12px;color:#a9323b}.preview-footnote{font-size:10px;line-height:1.6;color:#8290a0;margin:18px 0 0}.preview-footer{padding:15px clamp(18px,3vw,34px);border-top:1px solid #edf0f4;display:flex;justify-content:space-between;gap:12px;color:#8290a0;font-size:10px}.preview-message{max-width:600px;margin:10vh auto;padding:28px}.preview-message h1{font-size:24px}.preview-message p{color:#667085}@media(max-width:760px){.preview-public{padding:14px 10px}.preview-shell{border-radius:16px}.preview-intro{display:block;padding-top:26px}.preview-intro h1{font-size:27px}.preview-status-pill{display:inline-flex;margin-top:15px}.preview-layout{grid-template-columns:minmax(0,1fr);gap:22px;padding-bottom:24px}.preview-media{min-height:160px;padding:10px}.preview-media img,.preview-media video{max-height:62vh}.preview-details h2{font-size:18px}.preview-footer{flex-direction:column;gap:5px}}@media(max-width:380px){.preview-public{padding:8px 6px}.preview-header{padding:12px}.preview-secure{font-size:10px}.preview-intro,.preview-layout{padding-left:13px;padding-right:13px}.preview-intro h1{font-size:24px}.preview-price strong{font-size:19px}}`}</style>
  </main>;
}
