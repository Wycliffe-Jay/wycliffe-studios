import { useEffect, useState } from 'react';
import { Check, ChevronRight, ImagePlus, LayoutDashboard, Menu, Pencil, Save, Settings, Trash2, Upload, UserRound, X } from 'lucide-react';
import './admin.css';
import CRM from './CRM';
import ClientOnboardingAdmin from './ClientOnboardingAdmin';
import { supabase, ADMIN_UID, signInAdmin } from './supabase';

type Section = 'Dashboard' | 'Hero Section' | 'Portfolio' | 'Services' | 'About' | 'Process' | 'Testimonials' | 'FAQ' | 'Images' | 'Settings' | 'Overview' | 'Clients' | 'Inquiries' | 'Sales Pipeline' | 'Projects' | 'Payments' | 'Follow-ups' | 'Reports' | 'Client Onboarding';
type Row = Record<string, any> & { id: string };

const nav: [Section, any][] = [
  ['Dashboard', LayoutDashboard], ['Hero Section', Pencil], ['Portfolio', ImagePlus],
  ['Services', Settings], ['About', UserRound], ['Process', Settings],
  ['Testimonials', UserRound], ['FAQ', Settings], ['Images', ImagePlus], ['Settings', Settings],
  ['Overview', LayoutDashboard], ['Clients', UserRound], ['Inquiries', Pencil], ['Sales Pipeline', Settings], ['Projects', ImagePlus], ['Payments', Settings], ['Follow-ups', Settings], ['Reports', LayoutDashboard], ['Client Onboarding', Link2]
];

function Admin() {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data, error }) => { if (mounted) { setSession(error || !data.user ? null : { user: data.user }); setAuthReady(true); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);
  if (!authReady) return <AuthShell><p>Checking admin session...</p></AuthShell>;
  if (!session) return <AdminLogin />;
  if (session.user?.id !== ADMIN_UID) return <AuthShell><h1>Admin access required</h1><p>This account is not authorized to manage Wycliffe Studios.</p><button className='save-btn auth-submit' onClick={() => supabase.auth.signOut()}>Sign out</button></AuthShell>;
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
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await signInAdmin(email.trim(), password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
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
          ['Overview','Clients','Inquiries','Sales Pipeline','Projects','Payments','Follow-ups','Reports'].includes(section) ? <CRM onClose={() => select('Dashboard')} initialPage={section as any} /> :
          section === 'Images' ? <Images flash={flash} fail={fail} /> :
          section === 'Settings' ? <SettingsPage flash={flash} fail={fail} /> :
          section === 'Client Onboarding' ? <ClientOnboardingAdmin /> :
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
        <button className='save-btn' onClick={() => save(rows.find(item => item.key === row.key) || row)}><Save /> Save</button>
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

const editableSiteSettings: { group: string; fields: [string, string, string][] }[] = [
  { group: 'Appearance & colors', fields: [['theme_background','Page background color','#F7F8FA'],['theme_text','Main text color','#0B1628'],['theme_muted','Muted text color','#5C6878'],['theme_accent','Main blue accent','#2477D4'],['theme_gold','Small gold accent','#D4A24C']] },
  { group: 'Header & navigation', fields: [
    ['nav_work','Work link label','Work'], ['nav_services','Services link label','Services'],
    ['nav_process','Process link label','Process'], ['nav_about','About link label','About'],
    ['nav_cta','Header button label','Book a Service']
  ]},
  { group: 'Brand & contact', fields: [
    ['brand_name','Business name','Wycliffe Studios'], ['contact_email','Contact email','radacliffemensah@gmail.com'],
    ['whatsapp_number','WhatsApp number','0591911002'], ['footer_copyright','Footer copyright','© 2026 Wycliffe Mensah']
  ]},
  { group: 'Hero section', fields: [
    ['hero_eyebrow','Small label','Available for selected projects'],
    ['hero_headline_line1','Headline line 1','Design that makes'], ['hero_headline_line2','Headline line 2','businesses seen.'],
    ['hero_subheadline','Description','I create sharp, memorable graphics for Ghanaian traders and growing businesses.'],
    ['hero_primary_cta','Main button label','Book a Service'], ['hero_secondary_cta','Second button label','See my work'],
    ['hero_trust_1','Trust point 1','Clear communication'], ['hero_trust_2','Trust point 2','Business-focused'],
    ['hero_trust_3','Trust point 3','Fast project brief'], ['hero_card_label','Card top-left label','WYCLIFFE / 01'],
    ['hero_card_location','Card top-right label','GHANA'], ['hero_card_image_label','Image tag','VISUAL IDENTITY'],
    ['hero_card_headline','Card heading','Visual identity.'], ['hero_service_1','Card service 1','POSTERS'],
    ['hero_service_2','Card service 2','LOGOS'], ['hero_service_3','Card service 3','BANNERS']
  ]},
  { group: 'Section headings & descriptions', fields: [
    ['proof_label','Client experience label','Client experience'], ['proof_heading','Client experience heading','Designed to earn attention.'],
    ['marquee_text','Moving banner text','POSTERS ✦ LOGOS ✦ BANNERS ✦ BRAND VISUALS ✦ SOCIAL GRAPHICS'],
    ['work_label','Work section label','01 / Selected work'], ['work_heading','Work heading','Ideas, made visible.'],
    ['work_description','Work description','Concept-led visuals built to stop the scroll and explain the offer.'],
    ['services_label','Services section label','02 / What I do'], ['services_heading','Services heading','Design with a purpose.'],
    ['services_description','Services description','Every visual is built around clarity, attention and the action you want customers to take.'],
    ['about_label','About section label','03 / Why Wycliffe'], ['about_heading','About heading','Good design should feel like an advantage.'],
    ['process_label','Process section label','04 / The process'], ['process_heading','Process heading','Simple from start to finish.'],
    ['process_description','Process description','A focused process keeps projects moving.'],
    ['testimonials_label','Testimonials section label','05 / Client words'], ['testimonials_heading','Testimonials heading','What clients say.'],
    ['quote_label','Quote section label','06 / Start a project'], ['quote_heading','Quote heading','Tell me what you need. I’ll take it from there.'],
    ['quote_description','Quote description','Give me the basics and I’ll reply with a clear next step.'],
    ['faq_label','FAQ section label','07 / FAQ'], ['faq_heading','FAQ heading','Before we start.'],
    ['cta_label','Bottom call-to-action label','08 / Have a project?'], ['cta_heading','Bottom call-to-action heading','Let’s make your next idea visible.'],
    ['cta_description','Bottom call-to-action description','Ready when you are. Start with a quick project request.']
  ]},
  { group: 'Quote form & footer buttons', fields: [
    ['quote_name_label','Name field label','Name'], ['quote_name_placeholder','Name placeholder','Your name'],
    ['quote_business_label','Business field label','Business'], ['quote_business_placeholder','Business placeholder','Business name'],
    ['quote_service_label','Service field label','What do you need?'], ['quote_service_placeholder','Service placeholder','Choose a service'],
    ['quote_budget_label','Budget field label','Budget range'], ['quote_budget_placeholder','Budget placeholder','Select budget'],
    ['quote_deadline_label','Deadline field label','Deadline'], ['quote_deadline_placeholder','Deadline placeholder','e.g. Friday'],
    ['quote_contact_label','Contact field label','Email or phone'], ['quote_contact_placeholder','Contact placeholder','How should I reach you?'],
    ['quote_details_label','Project details label','Tell me about the project'],
    ['quote_details_placeholder','Project details placeholder','What are you promoting or building?'],
    ['quote_submit_label','Submit button label','Book a Service'], ['quote_form_note','Form note','Submitting opens your email app. Nothing is stored on this website.'],
    ['quote_proof_1','Quote reassurance 1','No complicated brief required'], ['quote_proof_2','Quote reassurance 2','Tell me your deadline upfront'], ['quote_proof_3','Quote reassurance 3','Final files prepared for use'],
    ['budget_options','Budget options (separate with |)','Under GHS 200 | GHS 200–500 | GHS 500–1,000 | GHS 1,000+ | Not sure yet'],
    ['cta_quote_button','Bottom quote button','Book a Service'], ['cta_email_button','Bottom email button','Email Wycliffe'],
    ['cta_whatsapp_button','Bottom WhatsApp button','WhatsApp'], ['scroll_hint','Scroll hint','Scroll to explore']
  ]}
];

function SettingsPage({ flash, fail }: { flash: () => void; fail: (e: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [busy, setBusy] = useState('');
  useEffect(() => {
    supabase.from('site_settings').select('*').order('key').then(({ data, error }) => {
      if (error) fail(error.message);
      const existing = data || [];
      const known = new Set(existing.map((r: Row) => r.key));
      const missing = editableSiteSettings.flatMap(group => group.fields)
        .filter(([key]) => !known.has(key))
        .map(([key, , value]) => ({ key, value }));
      setRows([...existing, ...missing.map((r, i) => ({ ...r, id: 'draft-' + i }))]);
    });
  }, []);
  const save = async (row: Row) => {
    setBusy(row.key);
    const result = await supabase.from('site_settings').upsert({ key: row.key, value: String(row.value ?? '') }, { onConflict: 'key' });
    if (result.error) fail(result.error.message);
    else { setRows(current => current.map(item => item.key === row.key ? { ...item, id: row.key } : item)); flash(); }
    setBusy('');
  };
  const saveAll = async () => {
    setBusy('*');
    const result = await supabase.from('site_settings').upsert(rows.map(({ key, value }) => ({ key, value: String(value ?? '') })), { onConflict: 'key' });
    if (result.error) fail(result.error.message); else flash();
    setBusy('');
  };
  const field = (key: string, label: string, fallback: string) => {
    const row = rows.find(r => r.key === key) || { key, value: fallback, id: 'draft-' + key };
    return <div className='setting-row' key={key}>
      <Field label={label} value={row.value ?? fallback} onChange={value => setRows(current => current.some(r => r.key === key) ? current.map(r => r.key === key ? { ...r, value } : r) : [...current, { ...row, value }])} />
      <button className='save-btn' disabled={busy === key || busy === '*'} onClick={() => save(rows.find(item => item.key === key) || row)}><Save /> {busy === key ? 'Saving...' : 'Save'}</button>
    </div>;
  };
  return <div className='form-page'>
    <FormHead eyebrow='SITE SETTINGS' title='Website content & controls' description='Edit the header links, every section heading, button labels, contact details and quote form text. Save each field or save everything together.' action={<button className='save-btn' disabled={!!busy} onClick={saveAll}><Save /> {busy === '*' ? 'Saving...' : 'Save all settings'}</button>} />
    <BrandIdentityEditor />
    {editableSiteSettings.map(group => <section className='settings-group' key={group.group}>
      <h3>{group.group}</h3>
      <div className='record-stack'>{group.fields.map(([key,label,value]) => field(key,label,value))}</div>
    </section>)}
    <section className='settings-group'>
      <h3>Other saved settings</h3>
      <p className='settings-help'>Additional settings already stored in your database.</p>
      <div className='record-stack'>{rows.filter(row => !editableSiteSettings.some(group => group.fields.some(([key]) => key === row.key)) && row.key !== 'logo_url').map(row =>
        <div className='setting-row' key={row.key}>
          <Field label={row.key} value={row.value} onChange={value => setRows(current => current.map(item => item.key === row.key ? { ...item, value } : item))} />
          <button className='save-btn' disabled={!!busy} onClick={() => save(row)}><Save /> Save</button>
        </div>)}</div>
      <div className='setting-row custom-setting'>
        <Field label='New setting key' value={customKey} onChange={setCustomKey} />
        <Field label='Value' value={customValue} onChange={setCustomValue} />
        <button className='add-btn' disabled={!customKey.trim() || rows.some(r => r.key === customKey.trim())} onClick={() => { const key = customKey.trim(); setRows(current => [...current, { key, value: customValue, id: 'draft-' + key }]); setCustomKey(''); setCustomValue(''); }}>+ Add</button>
      </div>
    </section>
  </div>;
}
export default Admin;