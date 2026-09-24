import { useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard';
import { applySiteContent, loadSiteContent, siteWhatsapp } from './siteContent';
import { createClientInquiry } from './firebase';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Dribbble,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Send,
  Palette,
  PenTool,
  Sparkles,
  X,
} from 'lucide-react';

const projects = [ // Portfolio resources are supplied through AppDeploy Resources.
  {
    title: 'Wycliffe Studios Showcase',
    type: 'Portfolio & Promotional Design',
    tag: 'Portfolio',
    image: '/resources/28756.png',
    description: 'A promotional showcase presenting selected graphic design work and the Wycliffe Studios visual direction.',
  },
  {
    title: 'Cakes & Catering Price List',
    type: 'Menu & Pricing Design',
    tag: 'Pricing',
    image: '/resources/28752.png',
    description: 'A polished pricing layout concept for a cakes, pastries, and catering business.',
  },
  {
    title: 'Provisions Store Campaign',
    type: 'Advertising Flyer',
    tag: 'Advertising',
    image: '/resources/28665.png',
    description: 'A bright promotional flyer designed to present everyday provisions, products, and a clear customer call to action.',
  },
  {
    title: 'Daily Needs Product Flyer',
    type: 'Product Promotion',
    tag: 'Product',
    image: '/resources/28675.jpg',
    description: 'A product-focused promotional composition built around groceries, drinks, snacks, and daily essentials.',
  },
  {
    title: 'Creative Studio Portfolio',
    type: 'Studio Presentation',
    tag: 'Portfolio',
    image: '/resources/28504.png',
    description: 'A portfolio-style presentation showing studio positioning, services, and selected client work.',
  },
  {
    title: 'Wycliffe Creative Studio Services',
    type: 'Services & Brand Promotion',
    tag: 'Services',
    image: '/resources/28512.png',
    description: 'A service-promotion graphic covering graphic design, event flyers, wedding posters, branding, print materials, and custom designs.',
  },
  {
    title: 'Tinamens Couture',
    type: 'Fashion Campaign Flyer',
    tag: 'Fashion',
    image: '/resources/28431.png',
    description: 'An elegant fashion campaign layout combining couture imagery, service information, and a premium visual direction.',
  },
  {
    title: 'LexaTech Solutions — Blue',
    type: 'Technology Advertising Design',
    tag: 'Technology',
    image: '/resources/28424.png',
    description: 'A technology-focused promotional design for computers, displays, audio, accessories, and support services.',
  },
  {
    title: 'LexaTech Solutions — Red',
    type: 'Technology Advertising Design',
    tag: 'Technology',
    image: '/resources/28345.png',
    description: 'A bold technology campaign design presenting products, service categories, value propositions, and a strong call to action.',
  },
]

const services = [
  {
    icon: PenTool,
    title: 'Graphic Design',
    text: 'Professional visuals for brands, businesses, campaigns, and everyday communication.',
  },
  {
    icon: Palette,
    title: 'Brand & Logo Design',
    text: 'Distinctive logos and visual systems that help businesses present themselves with confidence.',
  },
  {
    icon: Sparkles,
    title: 'Ceremony Posters',
    text: 'Elegant, attention-grabbing designs for ceremonies, events, announcements, and celebrations.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Custom Design',
    text: 'Need something different? Get a tailored design solution built around your goal.',
  },
];

function App() {
  const [admin, setAdmin] = useState(window.location.hash === '#admin');
  useEffect(() => {
    const onHash = () => setAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    loadSiteContent().then(content => applySiteContent(content)).catch(() => {});
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
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

  const submitQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      await createClientInquiry({ name:quote.name, business:quote.business, email:quote.email, phone:quote.phone, service:quote.service, budget:quote.budget, projectDetails:quote.details });
    } catch (error) {
      console.error('Could not save inquiry', error);
    }
    window.open('https://wa.me/' + siteWhatsapp + '?text=' + encodeURIComponent(message), '_blank');
  };

  const goTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (admin) return <AdminDashboard onBack={() => { window.location.hash = ''; window.location.reload(); }} />;

  return (
    <div className="site">
      <header className="nav">
        <button
          className="brand"
          onClick={() => goTo('home')}
          aria-label="Wycliffe Studios home"
        >
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
        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span></span> GRAPHIC DESIGN • BRANDING • VISUALS
            </div>
            <h1>
              Design that makes
              <br />
              <em>your brand</em> stand out.
            </h1>
            <p>
              Wycliffe Studios creates clean, purposeful graphics for
              businesses, brands, events, and people who want to be remembered.
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={() => goTo('work')}>
                Explore my work <ArrowUpRight size={18} />
              </button>
              <button className="text-button" onClick={() => goTo('contact')}>
                Let's work together <span>→</span>
              </button>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} /> Creative & intentional
              </span>
              <span>
                <Check size={15} /> Built for your goal
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Abstract Wycliffe Studios design composition"
          >
            <div className="orb orb-one"></div>
            <div className="orb orb-two"></div>
            <div className="art-card art-back">
              <span>VISUAL</span>
              <strong>IMPACT</strong>
            </div>
            <div className="art-card art-front">
              <div className="mini-logo">W</div>
              <p>
                WYCLIFFE
                <br />
                <b>STUDIOS</b>
              </p>
              <span>CREATE • REFINE • DELIVER</span>
            </div>
            <div className="floating-card">
              <span>01</span>
              <b>
                YOUR
                <br />
                IDEA
              </b>
              <ArrowUpRight size={18} />
            </div>
          </div>
        </section>

        <section className="statement">
          <p>GOOD DESIGN ISN'T JUST ABOUT LOOKING GOOD.</p>
          <h2>
            It is about making the right <span>impression.</span>
          </h2>
        </section>

        <section id="work" className="section work-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span></span> SELECTED WORK
              </div>
              <h2>
                A selection of
                <br />
                <em>what I create.</em>
              </h2>
            </div>
            <p>
              Every project starts with a purpose. Browse the portfolio and
              imagine what we could build for your brand.
            </p>
          </div>
          <div className="projects">
            {projects.map((project, i) => (
              <button
                className="project"
                key={project.title}
                onClick={() => setActiveProject(i)}
                aria-label={'View ' + project.title}
              >
                <div className="project-visual">
                  <img className="project-image" src={project.image} alt={project.title} />
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
              <div className="eyebrow light">
                <span></span> WHAT I DO
              </div>
              <h2>
                Design services
                <br />
                <em>built around you.</em>
              </h2>
            </div>
          </div>
          <div className="service-grid">
            {services.map(({ icon: Icon, title, text }, i) => (
              <div className="service" key={title}>
                <div className="service-top">
                  <span>0{i + 1}</span>
                  <Icon size={23} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="service-line"></span>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="pricing section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span></span> PACKAGES & PRICING
              </div>
              <h2>
                Clear options.
                <br />
                <em>Custom quotes.</em>
              </h2>
            </div>
            <p>
              Choose a starting point below. Final pricing is tailored to the
              scope, number of designs, revisions, and turnaround time.
            </p>
          </div>
          <div className="pricing-grid">
            <article className="price-card">
              <span className="price-kicker">01</span>
              <h3>Single Design</h3>
              <p>For one focused design such as a flyer, poster, social graphic, or promotional artwork.</p>
              <strong>Custom quote</strong>
              <button className="text-button" onClick={() => goTo('contact')}>Request a quote →</button>
            </article>
            <article className="price-card featured">
              <span className="price-kicker">02</span>
              <h3>Brand Starter</h3>
              <p>Logo design plus core brand direction for a business that wants a more consistent visual identity.</p>
              <strong>Custom quote</strong>
              <button className="text-button" onClick={() => goTo('contact')}>Request a quote →</button>
            </article>
            <article className="price-card">
              <span className="price-kicker">03</span>
              <h3>Business Design Pack</h3>
              <p>A tailored collection of graphics for campaigns, social media, promotions, events, or print.</p>
              <strong>Custom quote</strong>
              <button className="text-button" onClick={() => goTo('contact')}>Request a quote →</button>
            </article>
          </div>
        </section>

        <section id="about" className="about section">
          <div className="about-mark">W</div>
          <div className="about-copy">
            <div className="eyebrow">
              <span></span> ABOUT WYCLIFFE STUDIOS
            </div>
            <h2>
              Thoughtful design.
              <br />
              <em>Real purpose.</em>
            </h2>
            <p>
              Wycliffe Studios is a graphic design studio focused on creating
              visuals that are clear, distinctive, and aligned with the message
              behind the brand.
            </p>
            <p>
              From a single promotional graphic to a complete visual identity,
              the goal is simple: turn an idea into design that feels
              intentional.
            </p>
            <div className="about-list">
              <span>01 — Understand</span>
              <span>02 — Create</span>
              <span>03 — Refine</span>
              <span>04 — Deliver</span>
            </div>
            <div className="client-types">
              <span>Businesses</span>
              <span>Churches & Events</span>
              <span>Fashion & Beauty</span>
              <span>Food & Hospitality</span>
              <span>Technology</span>
              <span>Personal Brands</span>
              <span>Startups & E-commerce</span>
            </div>
          </div>
        </section>

        <section id="contact" className="contact">
          <div className="contact-inner">
            <div className="eyebrow light">
              <span></span> HAVE A PROJECT IN MIND?
            </div>
            <h2>
              Let's create something
              <br />
              <em>worth noticing.</em>
            </h2>
            <p>
              Tell me what you are building, what you need designed, and where
              you want to take it. You can also request a quote directly below.
            </p>
            <form className="quote-form" onSubmit={submitQuote}>
              <div className="form-grid">
                <label>
                  Your name
                  <input required value={quote.name} onChange={e => setQuote({ ...quote, name: e.target.value })} placeholder="Your name" />
                </label>
                <label>
                  Business / brand
                  <input value={quote.business} onChange={e => setQuote({ ...quote, business: e.target.value })} placeholder="Business or brand name" />
                </label>
                <label>
                  Email
                  <input required type="email" value={quote.email} onChange={e => setQuote({ ...quote, email: e.target.value })} placeholder="you@example.com" />
                </label>
                <label>
                  Phone
                  <input required value={quote.phone} onChange={e => setQuote({ ...quote, phone: e.target.value })} placeholder="Phone / WhatsApp number" />
                </label>
                <label>
                  What do you need?
                  <select value={quote.service} onChange={e => setQuote({ ...quote, service: e.target.value })}>
                    <option>Graphic Design</option>
                    <option>Brand & Logo Design</option>
                    <option>Ceremony / Event Poster</option>
                    <option>Social Media Design</option>
                    <option>Flyer / Advertising Design</option>
                    <option>Print Design</option>
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
              <label>
                Tell me about the project
                <textarea required rows={5} value={quote.details} onChange={e => setQuote({ ...quote, details: e.target.value })} placeholder="What do you want designed? Include any deadline, size, text, or other important details." />
              </label>
              <button className="contact-button form-submit" type="submit">
                Request a quote on WhatsApp <Send size={18} />
              </button>
            </form>
            <div className="contact-actions">
              <a className="contact-button" href="mailto:radacliffemensah@gmail.com">
                Email me <Mail size={18} />
              </a>
              <a className="contact-button secondary-contact" href="https://wa.me/233591911002" target="_blank" rel="noreferrer">
                WhatsApp <MessageCircle size={18} />
              </a>
              <a className="contact-button secondary-contact" href="tel:+233591911002">
                Call <Phone size={18} />
              </a>
            </div>
            <div className="contact-details">
              <a href="mailto:radacliffemensah@gmail.com">radacliffemensah@gmail.com</a>
              <a href="tel:+233591911002">0591911002</a>
            </div>
          </div>
          <div className="contact-decoration">
            W<span>.</span>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark">W</span>
          <div>
            <strong>Wycliffe Studios</strong>
            <small>GRAPHIC DESIGN</small>
          </div>
        </div>
        <p>© 2026 Wycliffe Studios. Crafted with purpose.</p>
        <div className="socials">
          <a href="https://instagram.com/wycliffe_studios" target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram size={19} />
          </a>
          <a href="mailto:radacliffemensah@gmail.com" aria-label="Email">
            <Mail size={19} />
          </a>
          <a href="https://wa.me/233591911002" target="_blank" rel="noreferrer" aria-label="WhatsApp">
            <MessageCircle size={19} />
          </a>
          <button className="admin-link" onClick={() => { window.location.hash = 'admin'; }} aria-label="Open admin dashboard">
            Admin
          </button>
        </div>
      </footer>

      {activeProject !== null && (
        <div className="modal-backdrop" onClick={() => setActiveProject(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setActiveProject(null)}
            >
              <X />
            </button>
            <div className="modal-visual">
              <img className="modal-image" src={projects[activeProject].image} alt={projects[activeProject].title} />
            </div>
            <div className="modal-content">
              <div className="eyebrow">
                <span></span> PROJECT CONCEPT
              </div>
              <h3>{projects[activeProject].title}</h3>
              <p>{projects[activeProject].description}</p>
              <button
                className="primary"
                onClick={() => {
                  setActiveProject(null);
                  goTo('contact');
                }}
              >
                Create something similar <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
