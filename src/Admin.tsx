import { useEffect, useState } from 'react';
import { Check, ChevronRight, ImagePlus, LayoutDashboard, Menu, Pencil, Save, Settings, Trash2, Upload, UserRound, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './admin.css';

const supabase = createClient('https://shzyzqwjyyutvldyzuee.supabase.co', 'sb_publishable_bspdymEMrxAzgwjNeyxcQw_BIOHgazK');

type Section = 'Dashboard' | 'Hero Section' | 'Portfolio' | 'Services' | 'About' | 'Process' | 'Testimonials' | 'FAQ' | 'Images' | 'Settings';
type Row = Record<string, any> & { id: string };

const nav: [Section, any][] = [
  ['Dashboard', LayoutDashboard], ['Hero Section', Pencil], ['Portfolio', ImagePlus],
  ['Services', Settings], ['About', UserRound], ['Process', Settings],
  ['Testimonials', UserRound], ['FAQ', Settings], ['Images', ImagePlus], ['Settings', Settings]
];

function Admin() {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setSession(data.session); setAuthReady(true); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);
  if (!authReady) return <AuthShell><p>Checking admin session...</p></AuthShell>;
  if (!session) return <AdminLogin />;
  return <AdminCms />;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className='admin-auth-shell'><div className='admin-auth-card'>{children}</div></div>;
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMessage(error.message);
    setBusy(false);
  };
  return <AuthShell>
    <div className='auth-mark'>W</div>
    <small className='auth-eyebrow'>WYCLIFFE STUDIOS / ADMIN</small>
    <h1>Admin sign in</h1>
    <p>Sign in with the admin account created in your Supabase project.</p>
    <form onSubmit={submit} className='auth-form'>
      <label>Email<input type='email' autoComplete='email' value={email} onChange={e => setEmail(e.target.value)} placeholder='Admin email' required /></label>
      <label>Password<input type='password' autoComplete='current-password' value={password} onChange={e => setPassword(e.target.value)} placeholder='Password' required /></label>
      {message && <div className='auth-error'>{message}</div>}
      <button className='save-btn auth-submit' disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
    </form>
    <p className='auth-note'>Admin access is intentionally restricted. Public visitors cannot use this screen to edit your site.</p>
  </AuthShell>;
}

function AdminCms() {
  const [section, setSection] = useState<Section>('Dashboard');
  const [menu, setMenu] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const fail = (message: string) => {
    console.error('[Wycliffe Studios] Admin Supabase request failed:', message);
    setError('Supabase connection unavailable — cached/default content is being used.');
    setTimeout(() => setError(''), 6000);
  };
  const select = (value: Section) => {
    setSection(value);
    setMenu(false);
  };

  return (
    <div className='visual-cms'>
      <aside className={menu ? 'vside open' : 'vside'}>
        <div className='vbrand'>
          <b>W</b>
          <span><strong>Wycliffe Studios</strong><small>ADMIN CMS</small></span>
          <button className='vicon close' onClick={() => setMenu(false)}><X /></button>
        </div>
        <nav>
          {nav.map(([name, Icon]) => (
            <button className={section === name ? 'active' : ''} key={name} onClick={() => select(name)}>
              <Icon /><span>{name}</span>
            </button>
          ))}
        </nav>
        <div className='vtip'>
          <b>{section === 'Dashboard' ? 'Live click-to-edit canvas' : 'Plain form editor'}</b>
          <small>{section === 'Dashboard' ? 'Dashboard stays as the live visual editor.' : 'Edit connected content with simple fields and Save buttons.'}</small>
        </div>
      </aside>
      {menu && <button className='vback' onClick={() => setMenu(false)} />}
      <main className='vmain'>
        <header className='vtop'>
          <button className='vicon hamburger' onClick={() => setMenu(true)}><Menu /></button>
          <div className='vtitle'><small>WYCLIFFE STUDIOS / ADMIN</small><h1>{section}</h1></div>
          <div className='vtools'>
            {saved && <span className='saved'><Check /> Saved</span>}
            {error && <span className='vnotice'>{error}</span>}
            <div className='vtools-actions'><a href='./'>Exit <ChevronRight /></a><button className='logout-btn' onClick={() => supabase.auth.signOut()}>Sign out</button></div>
          </div>
        </header>
        {section === 'Dashboard' ? <Dashboard /> :
          section === 'Images' ? <Images flash={flash} fail={fail} /> :
          section === 'Settings' ? <SettingsPage flash={flash} fail={fail} /> :
          <FormPage section={section} flash={flash} fail={fail} />}
      </main>
    </div>
  );
}

function Dashboard() {
  return <div className='dashboard-frame'><iframe title='Live click-to-edit dashboard' src={window.location.pathname} /></div>;
}

const heroFields = [
  ['eyebrow', 'Eyebrow text'], ['headline_line1', 'Headline Line 1'], ['headline_line2', 'Headline Line 2'],
  ['subheadline', 'Subheadline'], ['primary_cta_text', 'Primary CTA text'], ['secondary_cta_text', 'Secondary CTA text'],
  ['trust_item_1', 'Trust item 1'], ['trust_item_2', 'Trust item 2'], ['trust_item_3', 'Trust item 3'],
  ['hero_card_label', 'Hero card label'], ['hero_card_location', 'Hero card location'],
  ['hero_card_image_label', 'Hero card image label'], ['hero_card_headline', 'Hero card headline'],
  ['hero_service_1', 'Hero service 1'], ['hero_service_2', 'Hero service 2'], ['hero_service_3', 'Hero service 3']
];

function FormPage({ section, flash, fail }: { section: Section; flash: () => void; fail: (e: string) => void }) {
  if (section === 'Hero Section') return <HeroForm flash={flash} fail={fail} />;
  if (section === 'About') return <AboutForm flash={flash} fail={fail} />;
  const table = section === 'Portfolio' ? 'portfolio_items' : section === 'Services' ? 'services' :
    section === 'Process' ? 'process_items' : section === 'Testimonials' ? 'testimonials' : 'faq_items';
  return <CrudForm table={table} section={section} flash={flash} fail={fail} />;
}

function Field({ label, value, onChange, multi = false }: { label: string; value: any; onChange: (v: string) => void; multi?: boolean }) {
  return <label className='field'><span>{label}</span>{multi ?
    <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} /> :
    <input value={value || ''} onChange={e => onChange(e.target.value)} />}</label>;
}

function HeroForm({ flash, fail }: { flash: () => void; fail: (e: string) => void }) {
  const [row, setRow] = useState<Row | null>(null);
  useEffect(() => {
    supabase.from('hero_content').select('*').limit(1).maybeSingle().then(({ data, error }) => {
      if (error) fail(error.message);
      setRow(data || null);
    });
  }, []);
  if (!row) return <div className='form-page'><p>Loading hero content...</p></div>;
  const save = async () => {
    const { id, ...payload } = row;
    const result = await supabase.from('hero_content').update(payload).eq('id', id);
    result.error ? fail(result.error.message) : flash();
  };
  return <div className='form-page'>
    <FormHead eyebrow='HERO CONTENT' title='Edit hero text' description='Text only. Use Images for the hero portrait.' action={<button className='save-btn' onClick={save}><Save /> Save Hero</button>} />
    <div className='form-grid-wide'>{heroFields.map(([key, label]) =>
      <Field key={key} label={label} value={row[key]} onChange={value => setRow({ ...row, [key]: value })} multi={key === 'subheadline'} />
    )}</div>
  </div>;
}

function AboutForm({ flash, fail }: { flash: () => void; fail: (e: string) => void }) {
  const [row, setRow] = useState<Row | null>(null);
  useEffect(() => {
    supabase.from('about_content').select('*').limit(1).maybeSingle().then(({ data, error }) => {
      if (error) fail(error.message);
      setRow(data || null);
    });
  }, []);
  if (!row) return <div className='form-page'><p>Loading About content...</p></div>;
  const save = async () => {
    const { id, ...payload } = row;
    const result = await supabase.from('about_content').update(payload).eq('id', id);
    result.error ? fail(result.error.message) : flash();
  };
  const fields: [string, string, boolean][] = [
    ['heading', 'Heading', false], ['paragraph', 'Paragraph', true], ['stat_1', 'Stat 1', false],
    ['stat_2', 'Stat 2', false], ['stat_3', 'Stat 3', false]
  ];
  return <div className='form-page'>
    <FormHead eyebrow='ABOUT CONTENT' title='Edit About' description='Text and stats only.' action={<button className='save-btn' onClick={save}><Save /> Save About</button>} />
    <div className='form-grid-wide'>{fields.map(([key, label, multi]) =>
      <Field key={key} label={label} value={row[key]} onChange={value => setRow({ ...row, [key]: value })} multi={multi} />
    )}</div>
  </div>;
}

function FormHead({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className='form-head'><div><small>{eyebrow}</small><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className='empty-state'><div className='empty-icon'><ImagePlus /></div><strong>{title}</strong><p>{description}</p></div>;
}

function CrudForm({ table, section, flash, fail }: { table: string; section: string; flash: () => void; fail: (e: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const fields: [string, string][] = table === 'portfolio_items' ? [['title', 'Title'], ['category', 'Category'], ['description', 'Description']] :
    table === 'services' ? [['title', 'Title'], ['description', 'Description']] :
    table === 'process_items' ? [['number', 'Number'], ['title', 'Title'], ['description', 'Description']] :
    table === 'testimonials' ? [['client_name', 'Client name'], ['quote', 'Quote'], ['role', 'Role']] :
    [['question', 'Question'], ['answer', 'Answer']];

  useEffect(() => {
    supabase.from(table).select('*').order('sort_order').then(({ data, error }) => {
      if (error) fail(error.message);
      setRows(data || []);
    });
  }, [table]);

  const save = async (row: Row) => {
    const payload: Record<string, any> = {};
    fields.forEach(([key]) => { payload[key] = row[key]; });
    const result = await supabase.from(table).update(payload).eq('id', row.id);
    result.error ? fail(result.error.message) : flash();
  };

  const add = async () => {
    const sort = (rows.length ? rows[rows.length - 1].sort_order || 0 : 0) + 1;
    const payload: Record<string, any> = { sort_order: sort };
    fields.forEach(([key]) => { payload[key] = key === 'number' ? String(sort).padStart(2, '0') : ''; });
    const result = await supabase.from(table).insert(payload).select().single();
    if (result.error) fail(result.error.message);
    else { setRows([...rows, result.data]); flash(); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this item?')) return;
    const result = await supabase.from(table).delete().eq('id', id);
    if (result.error) fail(result.error.message);
    else { setRows(rows.filter(row => row.id !== id)); flash(); }
  };

  return <div className='form-page'>
    <FormHead eyebrow={table.toUpperCase()} title={'Edit ' + section} description='Plain form editing - no live preview on this page.'
      action={<button className='add-btn' onClick={add}>{table === 'portfolio_items' ? '+ Add New Work' : '+ Add'}</button>} />
    <div className='record-stack'>
      {rows.map((row, index) => <div className='record-card' key={row.id}>
        <div className='record-title'><strong>{String(index + 1).padStart(2, '0')}</strong>
          <span>{row.title || row.client_name || row.question || 'New item'}</span>
          <button className='remove-btn' onClick={() => remove(row.id)}><Trash2 /> Remove</button>
        </div>
        <div className='form-grid-wide'>{fields.map(([key, label]) =>
          <Field key={key} label={label} value={row[key]} onChange={value => setRows(rows.map(item => item.id === row.id ? { ...item, [key]: value } : item))}
            multi={['description', 'quote', 'answer'].includes(key)} />
        )}</div>
        <button className='save-btn' onClick={() => save(row)}><Save /> Save</button>
      </div>)}
    </div>
  </div>;
}

function Images({ flash, fail }: { flash: () => void; fail: (e: string) => void }) {
  const [hero, setHero] = useState<Row | null>(null);
  const [portfolio, setPortfolio] = useState<Row[]>([]);
  const [testimonials, setTestimonials] = useState<Row[]>([]);
  const [logo, setLogo] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    const [h, p, t, l] = await Promise.all([
      supabase.from('hero_content').select('*').limit(1).maybeSingle(),
      supabase.from('portfolio_items').select('id,title,image_url').order('sort_order'),
      supabase.from('testimonials').select('id,client_name,photo_url').order('sort_order'),
      supabase.from('site_settings').select('value').eq('key','logo_url').maybeSingle()
    ]);
    if (h.error) fail(h.error.message);
    if (p.error) fail(p.error.message);
    if (t.error) fail(t.error.message);
    setHero(h.data || null); setPortfolio(p.data || []); setTestimonials(t.data || []); setLogo(l.data?.value || '');
  };

  useEffect(() => { load(); }, []);

  const change = async (table: string, id: string, field: string, file?: File) => {
    setBusy(table + id);
    let url: string | null = null;
    if (file) {
      const extension = file.name.split('.').pop() || 'jpg';
      const path = 'editor/' + crypto.randomUUID() + '.' + extension;
      const upload = await supabase.storage.from('site-images').upload(path, file, { cacheControl: '3600' });
      if (upload.error) { fail(upload.error.message); setBusy(''); return; }
      url = supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl;
    }
    const result = await supabase.from(table).update({ [field]: url }).eq('id', id);
    if (result.error) fail(result.error.message); else flash();
    await load();
    setBusy('');
  };

  return <div className='form-page images-page'>
    <FormHead eyebrow='MEDIA LIBRARY' title='Images' description='Every editable image used by the website.' />
    <ImageGroup title='Hero'>{hero && <ImageSlot label='Hero portrait / placeholder image' url={hero.hero_card_image_url} table='hero_content' id={hero.id} field='hero_card_image_url' busy={busy} onChange={change} />}</ImageGroup>
    <ImageGroup title='Portfolio'>{portfolio.map(row => <ImageSlot key={row.id} label={row.title || 'Untitled portfolio item'} url={row.image_url} table='portfolio_items' id={row.id} field='image_url' busy={busy} onChange={change} />)}</ImageGroup>
    <ImageGroup title='Testimonials'>{testimonials.map(row => <ImageSlot key={row.id} label={row.client_name || 'Unnamed client'} url={row.photo_url} table='testimonials' id={row.id} field='photo_url' busy={busy} onChange={change} />)}</ImageGroup>
  </div>;
}

function ImageGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className='image-group'><h3>{title}</h3><div className='image-grid'>{children}</div></section>;
}

function ImageSlot({ label, url, table, id, field, busy, onChange }: { label: string; url?: string; table: string; id: string; field: string; busy: string; onChange: (table: string, id: string, field: string, file?: File) => void }) {
  return <div className='image-slot'>
    <div className='thumb'>{url ? <img src={url} alt={label} /> : <div className='no-image'>No image</div>}</div>
    <div className='image-info'><strong>{label}</strong><small>{url ? 'Image uploaded' : 'Placeholder / empty slot'}</small>
      <div className='image-actions'>
        <label className='upload-btn'><Upload /> {busy === table + id ? 'Uploading...' : 'Upload/Replace'}
          <input hidden type='file' accept='image/*' onChange={e => e.target.files?.[0] && onChange(table, id, field, e.target.files[0])} />
        </label>
        <button className='remove-image' disabled={!url} onClick={() => onChange(table, id, field)}><Trash2 /> Remove</button>
      </div>
    </div>
  </div>;
}

function BrandIdentityEditor() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key','logo_url').maybeSingle().then(({ data }) => setUrl(data?.value || ''));
  }, []);
  const upload = async (file: File) => {
    setBusy(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = 'editor/logo-' + crypto.randomUUID() + '.' + ext;
    const result = await supabase.storage.from('site-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (result.error) { alert(result.error.message); setBusy(false); return; }
    const publicUrl = supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl;
    const save = await supabase.from('site_settings').upsert({ key: 'logo_url', value: publicUrl }, { onConflict: 'key' });
    if (save.error) alert(save.error.message);
    else setUrl(publicUrl);
    setBusy(false);
  };
  const remove = async () => {
    const result = await supabase.from('site_settings').upsert({ key: 'logo_url', value: '' }, { onConflict: 'key' });
    if (result.error) alert(result.error.message);
    else setUrl('');
  };
  return <section className='brand-identity-editor'>
    <div><small>BRAND IDENTITY</small><h3>Business logo</h3><p>Upload the logo that should appear beside your business name.</p></div>
    <div className='brand-logo-editor-row'>
      <div className='brand-logo-preview'>{url ? <img src={url} alt='Current logo' /> : <span>W</span>}</div>
      <div className='brand-logo-actions'>
        <label className='upload-btn'><Upload /> {busy ? 'Uploading...' : 'Upload / Replace'}
          <input hidden type='file' accept='image/png,image/jpeg,image/webp,image/svg+xml' disabled={busy} onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        <button className='remove-image' disabled={!url || busy} onClick={remove}><Trash2 /> Remove logo</button>
      </div>
    </div>
  </section>;
}

function SettingsPage({ flash, fail }: { flash: () => void; fail: (e: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    supabase.from('site_settings').select('*').order('key').then(({ data, error }) => {
      if (error) fail(error.message);
      setRows(data || []);
    });
  }, []);
  const save = async (row: Row) => {
    const result = await supabase.from('site_settings').update({ value: row.value }).eq('key', row.key);
    result.error ? fail(result.error.message) : flash();
  };
  return <div className='form-page'>
    <FormHead eyebrow='SITE SETTINGS' title='Settings' description='Brand, contact, navigation and section text.' />
    <BrandIdentityEditor />
    <div className='brand-settings-note'><strong>Business name</strong><p>Edit <code>brand_name</code> below to change the name shown across the website.</p></div>
    <div className='record-stack'>{rows.map(row => <div className='setting-row' key={row.key}>
      <Field label={row.key} value={row.value} onChange={value => setRows(rows.map(item => item.key === row.key ? { ...item, value } : item))} />
      <button className='save-btn' onClick={() => save(row)}><Save /> Save</button>
    </div>)}</div>
  </div>;
}

export default Admin;