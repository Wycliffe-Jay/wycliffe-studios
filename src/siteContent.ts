import { readCollection, readSection } from './supabase';

export type EditableContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroEmphasis: string;
  heroDescription: string;
  statementLabel: string;
  statement: string;
  projects: Array<{
    id?: string;
    title: string;
    type: string;
    tag: string;
    description: string;
    imageUrl?: string;
    order?: number;
  }>;
  services: Array<{ id?: string; title: string; text: string; order: number }>;
  prices: Array<{ id?: string; title: string; description: string; price: string; order: number }>;
  aboutTitle: string;
  aboutParagraph1: string;
  aboutParagraph2: string;
  clientTypes: string[];
  contactTitle: string;
  contactDescription: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
};

export const defaultContent: EditableContent = {
  heroEyebrow: 'GRAPHIC DESIGN • BRANDING • VISUALS',
  heroTitle: 'Design that makes',
  heroEmphasis: 'your brand',
  heroDescription: 'Wycliffe Studios creates clean, purposeful graphics for businesses, brands, events, and people who want to be remembered.',
  statementLabel: "GOOD DESIGN ISN'T JUST ABOUT LOOKING GOOD.",
  statement: 'It is about making the right impression.',
  projects: [
    { title:'Wycliffe Studios Showcase', type:'Portfolio & Promotional Design', tag:'Portfolio', imageUrl:'/resources/28756.png', description:'A promotional showcase presenting selected graphic design work and the Wycliffe Studios visual direction.', order:1 },
    { title:'Cakes & Catering Price List', type:'Menu & Pricing Design', tag:'Pricing', imageUrl:'/resources/28752.png', description:'A polished pricing layout concept for a cakes, pastries, and catering business.', order:2 },
    { title:'Provisions Store Campaign', type:'Advertising Flyer', tag:'Advertising', imageUrl:'/resources/28665.png', description:'A bright promotional flyer designed to present everyday provisions, products, and a clear customer call to action.', order:3 },
    { title:'Daily Needs Product Flyer', type:'Product Promotion', tag:'Product', imageUrl:'/resources/28675.jpg', description:'A product-focused promotional composition built around groceries, drinks, snacks, and daily essentials.', order:4 },
    { title:'Creative Studio Portfolio', type:'Studio Presentation', tag:'Portfolio', imageUrl:'/resources/28504.png', description:'A portfolio-style presentation showing studio positioning, services, and selected client work.', order:5 },
    { title:'Wycliffe Creative Studio Services', type:'Services & Brand Promotion', tag:'Services', imageUrl:'/resources/28512.png', description:'A service-promotion graphic covering graphic design, event flyers, wedding posters, branding, print materials, and custom designs.', order:6 },
    { title:'Tinamens Couture', type:'Fashion Campaign Flyer', tag:'Fashion', imageUrl:'/resources/28431.png', description:'An elegant fashion campaign layout combining couture imagery, service information, and a premium visual direction.', order:7 },
    { title:'LexaTech Solutions — Blue', type:'Technology Advertising Design', tag:'Technology', imageUrl:'/resources/28424.png', description:'A technology-focused promotional design for computers, displays, audio, accessories, and support services.', order:8 },
    { title:'LexaTech Solutions — Red', type:'Technology Advertising Design', tag:'Technology', imageUrl:'/resources/28345.png', description:'A bold technology campaign design presenting products, service categories, value propositions, and a strong call to action.', order:9 },
  ],
  services: [
    { title:'Graphic Design', text:'Professional visuals for brands, businesses, campaigns, and everyday communication.', order:1 },
    { title:'Brand & Logo Design', text:'Distinctive logos and visual systems that help businesses present themselves with confidence.', order:2 },
    { title:'Ceremony Posters', text:'Elegant, attention-grabbing designs for ceremonies, events, announcements, and celebrations.', order:3 },
    { title:'Custom Design', text:'Need something different? Get a tailored design solution built around your goal.', order:4 },
  ],
  prices: [
    { title:'Single Design', description:'For one focused design such as a flyer, poster, social graphic, or promotional artwork.', price:'Custom quote', order:1 },
    { title:'Brand Starter', description:'Logo design plus core brand direction for a business that wants a more consistent visual identity.', price:'Custom quote', order:2 },
    { title:'Business Design Pack', description:'A tailored collection of graphics for campaigns, social media, promotions, events, or print.', price:'Custom quote', order:3 },
  ],
  aboutTitle:'Thoughtful design. Real purpose.',
  aboutParagraph1:'Wycliffe Studios is a graphic design studio focused on creating visuals that are clear, distinctive, and aligned with the message behind the brand.',
  aboutParagraph2:'From a single promotional graphic to a complete visual identity, the goal is simple: turn an idea into design that feels intentional.',
  clientTypes:['Businesses','Churches & Events','Fashion & Beauty','Food & Hospitality','Technology','Personal Brands','Startups & E-commerce'],
  contactTitle:"Let's create something worth noticing.",
  contactDescription:'Tell me what you are building, what you need designed, and where you want to take it. You can also request a quote directly below.',
  email:'radacliffemensah@gmail.com',
  phone:'0591911002',
  whatsapp:'233591911002',
  instagram:'https://instagram.com/wycliffe_studios',
};

export let siteWhatsapp = defaultContent.whatsapp;

export async function loadSiteContent(): Promise<EditableContent> {
  const [hero, about, contact, services, prices, projects] = await Promise.all([
    readSection('hero'),
    readSection('about'),
    readSection('contact'),
    readCollection('services'),
    readCollection('pricing'),
    readCollection('projects'),
  ]);

  const content = structuredClone(defaultContent);

  if (hero) {
    Object.assign(content, {
      heroEyebrow: hero.eyebrow ?? content.heroEyebrow,
      heroTitle: hero.headline ?? content.heroTitle,
      heroEmphasis: hero.emphasis ?? content.heroEmphasis,
      heroDescription: hero.subheadline ?? content.heroDescription,
      statementLabel: hero.statementLabel ?? content.statementLabel,
      statement: hero.statement ?? content.statement,
    });
  }

  if (about) {
    Object.assign(content, {
      aboutParagraph1: about.text ?? content.aboutParagraph1,
      aboutTitle: about.title ?? content.aboutTitle,
      aboutParagraph2: about.text2 ?? content.aboutParagraph2,
      clientTypes: about.clientTypes ?? content.clientTypes,
    });
  }

  if (contact) {
    Object.assign(content, {
      email: contact.email ?? content.email,
      phone: contact.phone ?? content.phone,
      whatsapp: contact.whatsapp ?? content.whatsapp,
      instagram: contact.instagram ?? content.instagram,
      contactTitle: contact.title ?? content.contactTitle,
      contactDescription: contact.description ?? content.contactDescription,
    });
  }

  if (services.length) {
    content.services = services
      .map((s: any, index) => ({
        id: s.id,
        title: s.name ?? s.title ?? '',
        text: s.description ?? s.text ?? '',
        order: Number(s.order ?? index + 1),
      }))
      .sort((a, b) => a.order - b.order);
  }

  if (prices.length) {
    content.prices = prices
      .map((p: any, index) => ({
        id: p.id,
        title: p.packageName ?? p.title ?? '',
        description: p.description ?? '',
        price: p.price ?? '',
        order: Number(p.order ?? index + 1),
      }))
      .sort((a, b) => a.order - b.order);
  }

  if (projects.length) {
    content.projects = projects
      .map((p: any, index) => ({
        id: p.id,
        title: p.title ?? '',
        type: p.category ?? p.type ?? '',
        tag: p.tag ?? p.category ?? '',
        description: p.description ?? '',
        imageUrl: p.imageUrl ?? '',
        order: Number(p.order ?? index + 1),
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  siteWhatsapp = content.whatsapp || defaultContent.whatsapp;
  return content;
}
