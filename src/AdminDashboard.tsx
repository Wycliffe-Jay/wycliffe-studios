import { useEffect, useState } from 'react';
import {
  Save,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  ADMIN_UID,
  signInAdmin,
  signOutAdmin,
  watchAuth,
  saveSection,
  readSection,
  readCollection,
  saveCollectionItem,
  deleteCollectionItem,
  uploadImage,
  updateInquiryStatus,
} from './firebase';
import { defaultContent, type EditableContent } from './siteContent';

type User = { email?: string | null; uid?: string };

type Inquiry = {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  projectDetails: string;
  status: string;
};

type Project = EditableContent['projects'][number];

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<EditableContent>(structuredClone(defaultContent));
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return watchAuth(current => {
      setUser(current && current.uid === ADMIN_UID ? { uid: current.uid, email: current.email } : null);
      setBusy(false);
    });
  }, []);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const [hero, about, contact, services, prices, projects, inquiryDocs] = await Promise.all([
        readSection('hero'),
        readSection('about'),
        readSection('contact'),
        readCollection('services'),
        readCollection('pricing'),
        readCollection('projects'),
        readCollection('client_inquiries'),
      ]);

      const next = structuredClone(defaultContent);

      if (hero) {
        Object.assign(next, {
          heroEyebrow: hero.eyebrow ?? next.heroEyebrow,
          heroTitle: hero.headline ?? next.heroTitle,
          heroEmphasis: hero.emphasis ?? next.heroEmphasis,
          heroDescription: hero.subheadline ?? next.heroDescription,
          statementLabel: hero.statementLabel ?? next.statementLabel,
          statement: hero.statement ?? next.statement,
        });
      }

      if (about) {
        Object.assign(next, {
          aboutTitle: about.title ?? next.aboutTitle,
          aboutParagraph1: about.text ?? next.aboutParagraph1,
          aboutParagraph2: about.text2 ?? next.aboutParagraph2,
          clientTypes: about.clientTypes ?? next.clientTypes,
        });
      }

      if (contact) {
        Object.assign(next, {
          contactTitle: contact.title ?? next.contactTitle,
          contactDescription: contact.description ?? next.contactDescription,
          email: contact.email ?? next.email,
          phone: contact.phone ?? next.phone,
          whatsapp: contact.whatsapp ?? next.whatsapp,
          instagram: contact.instagram ?? next.instagram,
        });
      }

      if (services.length) {
        next.services = services.map((s: any, index) => ({
          id: s.id,
          title: s.name ?? s.title ?? '',
          text: s.description ?? s.text ?? '',
          order: Number(s.order ?? index + 1),
        }));
      }

      if (prices.length) {
        next.prices = prices.map((p: any, index) => ({
          id: p.id,
          title: p.packageName ?? p.title ?? '',
          description: p.description ?? '',
          price: p.price ?? '',
          order: Number(p.order ?? index + 1),
        }));
      }

      if (projects.length) {
        next.projects = projects.map((p: any, index) => ({
          id: p.id,
          title: p.title ?? '',
          type: p.category ?? p.type ?? '',
          tag: p.tag ?? p.category ?? '',
          description: p.description ?? '',
          imageUrl: p.imageUrl ?? '',
          order: Number(p.order ?? index + 1),
        }));
      }

      setContent(next);
      setInquiries(inquiryDocs as Inquiry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load Firebase data.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  const save = async () => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await Promise.all([
        saveSection('hero', {
          headline: content.heroTitle,
          subheadline: content.heroDescription,
          eyebrow: content.heroEyebrow,
          emphasis: content.heroEmphasis,
          statementLabel: content.statementLabel,
          statement: content.statement,
        }),
        saveSection('about', {
          title: content.aboutTitle,
          text: content.aboutParagraph1,
          text2: content.aboutParagraph2,
          clientTypes: content.clientTypes,
        }),
        saveSection('contact', {
          title: content.contactTitle,
          description: content.contactDescription,
          email: content.email,
          phone: content.phone,
          whatsapp: content.whatsapp,
          instagram: content.instagram,
        }),
        ...content.services.map((service, index) =>
          saveCollectionItem('services', service.id, {
            name: service.title,
            description: service.text,
            order: Number(service.order || index + 1),
          }),
        ),
        ...content.prices.map((price, index) =>
          saveCollectionItem('pricing', price.id, {
            packageName: price.title,
            price: price.price,
            description: price.description,
            order: Number(price.order || index + 1),
          }),
        ),
        ...content.projects.map((project, index) =>
          saveCollectionItem('projects', project.id, {
            title: project.title,
            category: project.type,
            tag: project.tag,
            description: project.description,
            imageUrl: project.imageUrl || '',
            order: Number(project.order || index + 1),
          }),
        ),
      ]);

      await load();
      setNotice('All changes saved to Firebase.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (
    collectionName: 'services' | 'pricing' | 'projects',
    id: string | undefined,
    update: () => void,
  ) => {
    try {
      if (id) await deleteCollectionItem(collectionName, id);
      update();
      setNotice('Item removed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove item.');
    }
  };

  if (busy) {
    return <div className="admin-shell"><div className="admin-loading">Loading Firebase…</div></div>;
  }

  if (!user) {
    return (
      <div className="admin-shell">
        <div className="admin-login">
          <div className="brand-mark">W</div>
          <h1>Wycliffe Studios Admin</h1>
          <p>Sign in with your Firebase admin account.</p>
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Password" value={password} onChange={setPassword} type="password" />
          <button
            className="primary"
            onClick={async () => {
              try {
                setError('');
                await signInAdmin(email, password);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Sign-in failed.');
              }
            }}
          >
            Sign in
          </button>
          <button className="text-button" onClick={onBack}>← Back to website</button>
          {error && <div className="admin-error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="eyebrow"><span /> ADMIN DASHBOARD</div>
          <h1>Manage Wycliffe Studios</h1>
          <p>{user.email}</p>
        </div>
        <div className="admin-header-actions">
          <button className="text-button" onClick={onBack}><ArrowLeft size={15} /> Website</button>
          <button className="secondary-admin" onClick={() => signOutAdmin()}><LogOut size={16} /> Sign out</button>
          <button className="secondary-admin" disabled={busy} onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>
          <button className="primary" disabled={saving} onClick={save}><Save size={17} /> {saving ? 'Saving…' : 'Save all'}</button>
        </div>
      </header>

      {notice && <div className="admin-success"><CheckCircle2 size={16} /> {notice}</div>}
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Hero & first impression</h2>
          <Field label="Eyebrow" value={content.heroEyebrow} onChange={v => setContent(c => ({ ...c, heroEyebrow: v }))} />
          <Field label="Headline" value={content.heroTitle} onChange={v => setContent(c => ({ ...c, heroTitle: v }))} />
          <Field label="Highlighted text" value={content.heroEmphasis} onChange={v => setContent(c => ({ ...c, heroEmphasis: v }))} />
          <Field label="Description" value={content.heroDescription} multiline onChange={v => setContent(c => ({ ...c, heroDescription: v }))} />
          <Field label="Statement label" value={content.statementLabel} onChange={v => setContent(c => ({ ...c, statementLabel: v }))} />
          <Field label="Statement" value={content.statement} multiline onChange={v => setContent(c => ({ ...c, statement: v }))} />
        </section>

        <section className="admin-card">
          <h2>About</h2>
          <Field label="Heading" value={content.aboutTitle} onChange={v => setContent(c => ({ ...c, aboutTitle: v }))} />
          <Field label="Paragraph 1" value={content.aboutParagraph1} multiline onChange={v => setContent(c => ({ ...c, aboutParagraph1: v }))} />
          <Field label="Paragraph 2" value={content.aboutParagraph2} multiline onChange={v => setContent(c => ({ ...c, aboutParagraph2: v }))} />
          <ArrayEditor label="Client categories" items={content.clientTypes} onChange={v => setContent(c => ({ ...c, clientTypes: v }))} />
        </section>

        <section className="admin-card">
          <h2>Contact & social</h2>
          <Field label="Heading" value={content.contactTitle} onChange={v => setContent(c => ({ ...c, contactTitle: v }))} />
          <Field label="Description" value={content.contactDescription} multiline onChange={v => setContent(c => ({ ...c, contactDescription: v }))} />
          <Field label="Email" value={content.email} onChange={v => setContent(c => ({ ...c, email: v }))} />
          <Field label="Phone" value={content.phone} onChange={v => setContent(c => ({ ...c, phone: v }))} />
          <Field label="WhatsApp number" value={content.whatsapp} onChange={v => setContent(c => ({ ...c, whatsapp: v }))} />
          <Field label="Instagram URL" value={content.instagram} onChange={v => setContent(c => ({ ...c, instagram: v }))} />
        </section>

        <section className="admin-card admin-wide">
          <div className="admin-section-head">
            <div>
              <h2>Services</h2>
              <p className="admin-help">Add, edit, reorder, or remove the services shown on your website.</p>
            </div>
            <button className="add-button" type="button" onClick={() => setContent(c => ({
              ...c,
              services: [...c.services, { title: 'New service', text: 'Describe this service.', order: c.services.length + 1 }],
            }))}><Plus size={15} /> Add service</button>
          </div>
          {content.services.map((service, i) => (
            <div className="mini-editor" key={service.id ?? 'new-service-' + i}>
              <div className="editor-row">
                <Field label={'Service ' + (i + 1)} value={service.title} onChange={v => setContent(c => ({ ...c, services: c.services.map((x, n) => n === i ? { ...x, title: v } : x) }))} />
                <Field label="Order" value={String(service.order)} type="number" onChange={v => setContent(c => ({ ...c, services: c.services.map((x, n) => n === i ? { ...x, order: Number(v) || 0 } : x) }))} />
              </div>
              <Field label="Description" value={service.text} multiline onChange={v => setContent(c => ({ ...c, services: c.services.map((x, n) => n === i ? { ...x, text: v } : x) }))} />
              <button className="danger-button" type="button" onClick={() => void removeItem('services', service.id, () => setContent(c => ({ ...c, services: c.services.filter((_, n) => n !== i) })))}><Trash2 size={14} /> Remove service</button>
            </div>
          ))}
        </section>

        <section className="admin-card admin-wide">
          <div className="admin-section-head">
            <div>
              <h2>Pricing</h2>
              <p className="admin-help">Control the packages, descriptions and prices displayed to potential clients.</p>
            </div>
            <button className="add-button" type="button" onClick={() => setContent(c => ({
              ...c,
              prices: [...c.prices, { title: 'New package', description: 'Describe what is included.', price: 'Custom quote', order: c.prices.length + 1 }],
            }))}><Plus size={15} /> Add package</button>
          </div>
          {content.prices.map((price, i) => (
            <div className="mini-editor" key={price.id ?? 'new-price-' + i}>
              <div className="editor-row">
                <Field label={'Package ' + (i + 1)} value={price.title} onChange={v => setContent(c => ({ ...c, prices: c.prices.map((x, n) => n === i ? { ...x, title: v } : x) }))} />
                <Field label="Order" value={String(price.order)} type="number" onChange={v => setContent(c => ({ ...c, prices: c.prices.map((x, n) => n === i ? { ...x, order: Number(v) || 0 } : x) }))} />
              </div>
              <Field label="Description" value={price.description} multiline onChange={v => setContent(c => ({ ...c, prices: c.prices.map((x, n) => n === i ? { ...x, description: v } : x) }))} />
              <Field label="Price" value={price.price} onChange={v => setContent(c => ({ ...c, prices: c.prices.map((x, n) => n === i ? { ...x, price: v } : x) }))} />
              <button className="danger-button" type="button" onClick={() => void removeItem('pricing', price.id, () => setContent(c => ({ ...c, prices: c.prices.filter((_, n) => n !== i) })))}><Trash2 size={14} /> Remove package</button>
            </div>
          ))}
        </section>

        <section className="admin-card admin-wide">
          <div className="admin-section-head">
            <div>
              <h2>Portfolio & image storage</h2>
              <p className="admin-help">Upload your actual design work to Firebase Storage. Images are limited to 10 MB and can be replaced whenever you want.</p>
            </div>
            <button className="add-button" type="button" onClick={() => setContent(c => ({
              ...c,
              projects: [...c.projects, { title: 'New project', type: 'Graphic Design', tag: 'Portfolio', description: 'Describe this project.', imageUrl: '', order: c.projects.length + 1 }],
            }))}><Plus size={15} /> Add project</button>
          </div>

          {content.projects.map((project, i) => (
            <ProjectEditor
              key={project.id ?? 'new-project-' + i}
              project={project}
              index={i}
              onChange={next => setContent(c => ({ ...c, projects: c.projects.map((x, n) => n === i ? next : x) }))}
              onRemove={() => void removeItem('projects', project.id, () => setContent(c => ({ ...c, projects: c.projects.filter((_, n) => n !== i) })))}
            />
          ))}
        </section>

        <section className="admin-card admin-wide">
          <div className="admin-section-head">
            <div>
              <h2>Client inquiries</h2>
              <p className="admin-help">Quote requests are stored in Firebase. Update their status as you work through your leads.</p>
            </div>
          </div>
          {inquiries.length === 0 ? (
            <p className="empty-state">No inquiries yet.</p>
          ) : (
            inquiries.map(item => (
              <div className="mini-editor inquiry" key={item.id}>
                <div className="inquiry-head">
                  <strong>{item.name} — {item.business || 'Personal'}</strong>
                  <select
                    value={item.status || 'New'}
                    onChange={async e => {
                      const status = e.target.value;
                      try {
                        await updateInquiryStatus(item.id, status);
                        setInquiries(items => items.map(x => x.id === item.id ? { ...x, status } : x));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Could not update inquiry.');
                      }
                    }}
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Won</option>
                    <option>Lost</option>
                  </select>
                </div>
                <p>{item.service} · {item.budget}</p>
                <p>{item.email} · {item.phone}</p>
                <p>{item.projectDetails}</p>
              </div>
            ))
          )}
        </section>
      </div>

      <div className="admin-bottom-save">
        <button className="primary" disabled={saving} onClick={save}><Save size={17} /> {saving ? 'Saving…' : 'Save all changes'}</button>
      </div>
    </div>
  );
}

function ProjectEditor({
  project,
  index,
  onChange,
  onRemove,
}: {
  project: Project;
  index: number;
  onChange: (project: Project) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const chooseImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setUploadError('');
    try {
      const url = await uploadImage(file, 'portfolio', setProgress);
      onChange({ ...project, imageUrl: url });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="project-editor mini-editor">
      <div className="project-editor-top">
        <div>
          <strong>Project {index + 1}</strong>
          <span>{project.id ? 'Saved project' : 'New project'}</span>
        </div>
        <button className="danger-button" type="button" onClick={onRemove}><Trash2 size={14} /> Remove</button>
      </div>

      <div className="project-editor-grid">
        <div>
          <Field label="Project title" value={project.title} onChange={v => onChange({ ...project, title: v })} />
          <div className="editor-row">
            <Field label="Category" value={project.type} onChange={v => onChange({ ...project, type: v })} />
            <Field label="Tag" value={project.tag} onChange={v => onChange({ ...project, tag: v })} />
          </div>
          <Field label="Description" value={project.description} multiline onChange={v => onChange({ ...project, description: v })} />
          <Field label="Order" value={String(project.order ?? index + 1)} type="number" onChange={v => onChange({ ...project, order: Number(v) || 0 })} />
        </div>

        <div className="image-uploader">
          <div className="image-preview">
            {project.imageUrl ? (
              <img src={project.imageUrl} alt={project.title || 'Portfolio preview'} />
            ) : (
              <div className="image-empty"><ImageIcon size={28} /><span>No image uploaded</span></div>
            )}
          </div>
          <label className="upload-button">
            <Upload size={16} />
            {uploading ? 'Uploading ' + progress + '%' : project.imageUrl ? 'Replace image' : 'Upload image'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={e => {
                void chooseImage(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
              disabled={uploading}
            />
          </label>
          <small>PNG, JPG, WEBP or GIF · max 10 MB</small>
          {uploadError && <div className="upload-error">{uploadError}</div>}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </label>
  );
}

function ArrayEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="array-editor">
      <div className="array-title">
        <span>{label}</span>
        <button type="button" onClick={() => onChange([...items, 'New category'])}><Plus size={14} /> Add</button>
      </div>
      {items.map((item, i) => (
        <div className="array-row" key={i}>
          <input value={item} onChange={e => onChange(items.map((x, n) => n === i ? e.target.value : x))} />
          <button type="button" onClick={() => onChange(items.filter((_, n) => n !== i))}><Trash2 size={15} /></button>
        </div>
      ))}
    </div>
  );
}
