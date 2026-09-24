import { useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard';
import { loadSiteContent, type EditableContent } from './siteContent';
import { createClientInquiry } from './supabase';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Palette,
  PenTool,
  Phone,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

const serviceIcons = [PenTool, Palette, Sparkles, BriefcaseBusiness];

function App() {
  const [admin, setAdmin] = useState(window.location.hash === '#admin');
  const [content, setContent] = useState<EditableContent | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [quote, setQuote] = useState({
    name: '',
    business: '',
    email: '',
    phone: '',
    service: 'Graphic Design',
    budget: 'Not sure yet',
    details: '',
  });

  useEffect(() => {
    const onHash = () => setAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    void loadSiteContent().then(setContent).catch(() => setContent(null));
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (content?.services[0]) {
      setQuote(q => ({ ...q, service: q.service || content.services[0].title }));
    }
  }, [content]);

  const goTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const submitQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content) return;

    const whatsapp = content.whatsapp.replace(/\D/g, '');
    const message = [
      'Hello Wycliffe Studios, I would like to request a quote.',
      '',
      'Name: ' + quote.name,
      'Business/Brand: ' + quote.business,
      'Email: ' + quote.email,
      'Phone: ' + quote.phone,
      'Service: ' + quote.service,
      'Budget: ' + quote.budget,
      'Project details: ' + quote.details,
    ].join('\n');

    try {
      await createClientInquiry({
        name: quote.name,
        business: quote.business,
        email: quote.email,
        phone: quote.phone,
        service: quote.service,
        budget: quote.budget,
        projectDetails: quote.details,
      });
    } catch (error) {
      console.error('Could not save inquiry', error);
    }

    window.open('https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(message), '_blank');
  };

  if (admin) {
    return <AdminDashboard onBack={() => { window.location.hash = ''; window.location.reload(); }} />;
  }

  if (!content) {
    return (
      <div className="site">
        <div className="admin-loading">Loading Wycliffe Studios…</div>
      </div>
    );
  }

  const phoneHref = 'tel:+233' + content.phone.replace(/^0/, '').replace(/^\+233/, '');
  const whatsappHref = 'https://wa.me/' + content.whatsapp.replace(/\D/g, '');

  return (
    <div className="site">
      <header className="nav">
        <button className="brand" onClick={() => goTo('home')} aria-label="Wycliffe Studios home">
          <span className="brand-mark">W</span>
          <span>
            <strong>Wycliffe</strong>
            <small>STUDIOS</small>
          </span>
        </button>

        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <button onClick={() => goTo('work')}>Work</button>
          <button onClick={() => goTo('services')}>Services</button>
          <button onClick={() => goTo('about')}>About</button>
          <button className="nav-cta" onClick={() => goTo('contact')}>
            Start a project <ArrowUpRight size={16} />
          </button>
        </nav>

        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span></span>{content.heroEyebrow}</div>
            <h1>
              {content.heroTitle}
              <br />
              <em>{content.heroEmphasis}</em> stand out.
            </h1>
            <p>{content.heroDescription}</p>
            <div className="hero-actions">
              <button className="primary" onClick={() => goTo('work')}>
                Explore my work <ArrowUpRight size={18} />
              </button>
              <button className="text-button" onClick={() => goTo('contact')}>
                Let's work together <span>→</span>
              </button>
            </div>
            <div className="hero-proof">
              <span><Check size={15} /> Creative & intentional</span>
              <span><Check size={15} /> Built for your goal</span>
            </div>
          </div>

          <div className="hero-art" aria-label="Abstract Wycliffe Studios design composition">
            <div className="orb orb-one"></div>
            <div className="orb orb-two"></div>
            <div className="art-card art-back">
              <span>VISUAL</span>
              <strong>IMPACT</strong>
            </div>
            <div className="art-card art-front">
              <div className="mini-logo">W</div>
              <p>WYCLIFFE<br /><b>STUDIOS</b></p>
              <span>CREATE • REFINE • DELIVER</span>
            </div>
            <div className="floating-card">
              <span>01</span>
              <b>YOUR<br />IDEA</b>
              <ArrowUpRight size={18} />
            </div>
          </div>
        </section>

        <section className="statement">
          <p>{content.statementLabel}</p>
          <h2>{content.statement}</h2>
        </section>

        <section id="work" className="section work-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span></span> SELECTED WORK</div>
              <h2>A selection of<br /><em>what I create.</em></h2>
            </div>
            <p>Every project starts with a purpose. Browse the portfolio and imagine what we could build for your brand.</p>
          </div>

          <div className="projects">
            {content.projects.map((project, i) => (
              <button
                className="project"
                key={project.id ?? project.title + i}
                onClick={() => setActiveProject(i)}
                aria-label={'View ' + project.title}
              >
                <div className="project-visual">
                  {project.imageUrl ? (
                    <img
                      className="project-image"
                      src={project.imageUrl}
                      alt={project.title}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="image-placeholder"><ImagePlaceholder /></div>
                  )}
                  <span className="project-number">{String(i + 1).padStart(2, '0')}</span>
                  <span className="project-image-label">{project.tag}</span>
                  <ArrowUpRight className="project-arrow" size={22} />
                </div>
                <div className="project-meta">
                  <div>
                    <strong>{project.title}</strong>
                    <span>{project.type}</span>
                  </div>
                  <ArrowUpRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="services" className="services">
          <div className="section-heading compact">
            <div>
              <div className="eyebrow light"><span></span> WHAT I DO</div>
              <h2>Design services<br /><em>built around you.</em></h2>
            </div>
          </div>
          <div className="service-grid">
            {content.services.map((service, i) => {
              const Icon = serviceIcons[i % serviceIcons.length];
              return (
                <div className="service" key={service.id ?? service.title + i}>
                  <div className="service-top"><span>0{i + 1}</span><Icon size={23} /></div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                  <span className="service-line"></span>
                </div>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="pricing section">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span></span> PACKAGES & PRICING</div>
              <h2>Clear options.<br /><em>Custom quotes.</em></h2>
            </div>
            <p>Choose a starting point below. Final pricing is tailored to the scope, number of designs, revisions, and turnaround time.</p>
          </div>
          <div className="pricing-grid">
            {content.prices.map((price, i) => (
              <article className={'price-card' + (i === 1 ? ' featured' : '')} key={price.id ?? price.title + i}>
                <span className="price-kicker">{String(i + 1).padStart(2, '0')}</span>
                <h3>{price.title}</h3>
                <p>{price.description}</p>
                <strong>{price.price}</strong>
                <button className="text-button" onClick={() => goTo('contact')}>Request a quote →</button>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="about section">
          <div className="about-mark">W</div>
          <div className="about-copy">
            <div className="eyebrow"><span></span> ABOUT WYCLIFFE STUDIOS</div>
            <h2>{content.aboutTitle}</h2>
            <p>{content.aboutParagraph1}</p>
            <p>{content.aboutParagraph2}</p>
            <div className="about-list">
              <span>01 — Understand</span>
              <span>02 — Create</span>
              <span>03 — Refine</span>
              <span>04 — Deliver</span>
            </div>
            <div className="client-types">
              {content.clientTypes.map(item => <span key={item}>{item}</span>)}
            </div>
          </div>
        </section>

        <section id="contact" className="contact">
          <div className="contact-inner">
            <div className="eyebrow light"><span></span> HAVE A PROJECT IN MIND?</div>
            <h2>{content.contactTitle}</h2>
            <p>{content.contactDescription}</p>

            <form className="quote-form" onSubmit={submitQuote}>
              <div className="form-grid">
                <label>Your name<input required value={quote.name} onChange={e => setQuote({ ...quote, name: e.target.value })} placeholder="Your name" /></label>
                <label>Business / brand<input value={quote.business} onChange={e => setQuote({ ...quote, business: e.target.value })} placeholder="Business or brand name" /></label>
                <label>Email<input required type="email" value={quote.email} onChange={e => setQuote({ ...quote, email: e.target.value })} placeholder="you@example.com" /></label>
                <label>Phone<input required value={quote.phone} onChange={e => setQuote({ ...quote, phone: e.target.value })} placeholder="Phone / WhatsApp number" /></label>
                <label>
                  What do you need?
                  <select value={quote.service} onChange={e => setQuote({ ...quote, service: e.target.value })}>
                    {content.services.map(service => <option key={service.id ?? service.title}>{service.title}</option>)}
                    <option>Custom Design</option>
                  </select>
                </label>
                <label>
                  Budget
                  <select value={quote.budget} onChange={e => setQuote({ ...quote, budget: e.target.value })}>
                    <option>Not sure yet</option>
                    <option>Under GH₵200</option>
                    <option>GH₵200 – GH₵500</option>
                    <option>GH₵500 – GH₵1,000</option>
                    <option>GH₵1,000+</option>
                  </select>
                </label>
              </div>
              <label>Tell me about the project<textarea required rows={5} value={quote.details} onChange={e => setQuote({ ...quote, details: e.target.value })} placeholder="What do you want designed? Include any deadline, size, text, or other important details." /></label>
              <button className="contact-button form-submit" type="submit">Request a quote on WhatsApp <Send size={18} /></button>
            </form>

            <div className="contact-actions">
              <a className="contact-button" href={'mailto:' + content.email}>Email me <Mail size={18} /></a>
              <a className="contact-button secondary-contact" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp <MessageCircle size={18} /></a>
              <a className="contact-button secondary-contact" href={phoneHref}>Call <Phone size={18} /></a>
            </div>
            <div className="contact-details">
              <a href={'mailto:' + content.email}>{content.email}</a>
              <a href={phoneHref}>{content.phone}</a>
            </div>
          </div>
          <div className="contact-decoration">W<span>.</span></div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark">W</span>
          <div><strong>Wycliffe Studios</strong><small>GRAPHIC DESIGN</small></div>
        </div>
        <p>© 2026 Wycliffe Studios. Crafted with purpose.</p>
        <div className="socials">
          <a href={content.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={19} /></a>
          <a href={'mailto:' + content.email} aria-label="Email"><Mail size={19} /></a>
          <a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={19} /></a>
          <button className="admin-link" onClick={() => { window.location.hash = 'admin'; }} aria-label="Open admin dashboard">Admin</button>
        </div>
      </footer>

      {activeProject !== null && content.projects[activeProject] && (
        <div className="modal-backdrop" onClick={() => setActiveProject(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveProject(null)}><X /></button>
            <div className="modal-visual">
              {content.projects[activeProject].imageUrl ? (
                <img
                  className="modal-image"
                  src={content.projects[activeProject].imageUrl}
                  alt={content.projects[activeProject].title}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="image-placeholder modal-placeholder"><ImagePlaceholder /></div>
              )}
            </div>
            <div className="modal-content">
              <div className="eyebrow"><span></span> PROJECT</div>
              <h3>{content.projects[activeProject].title}</h3>
              <p>{content.projects[activeProject].description}</p>
              <button className="primary" onClick={() => { setActiveProject(null); goTo('contact'); }}>
                Create something similar <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImagePlaceholder() {
  return <span className="image-placeholder-inner">Upload a portfolio image in Admin</span>;
}

export default App;
