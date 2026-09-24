import { readCollection, readSection } from './firebase';

export type EditableContent = {
  heroEyebrow: string; heroTitle: string; heroEmphasis: string; heroDescription: string;
  statementLabel: string; statement: string;
  projects: Array<{ id?: string; title:string; type:string; tag:string; description:string; imageUrl?:string }>;
  services: Array<{ id?: string; title:string; text:string; order:number }>;
  prices: Array<{ id?: string; title:string; description:string; price:string; order:number }>;
  aboutTitle:string; aboutParagraph1:string; aboutParagraph2:string; clientTypes:string[];
  contactTitle:string; contactDescription:string; email:string; phone:string; whatsapp:string; instagram:string;
};

export const defaultContent: EditableContent = {
  heroEyebrow: 'GRAPHIC DESIGN • BRANDING • VISUALS',
  heroTitle: 'Design that makes',
  heroEmphasis: 'your brand',
  heroDescription: 'Wycliffe Studios creates clean, purposeful graphics for businesses, brands, events, and people who want to be remembered.',
  statementLabel: "GOOD DESIGN ISN'T JUST ABOUT LOOKING GOOD.",
  statement: 'It is about making the right impression.',
  projects: [
    { title:'Wycliffe Studios Showcase', type:'Portfolio & Promotional Design', tag:'Portfolio', imageUrl:'/resources/28756.png', description:'A promotional showcase presenting selected graphic design work and the Wycliffe Studios visual direction.' },
    { title:'Cakes & Catering Price List', type:'Menu & Pricing Design', tag:'Pricing', imageUrl:'/resources/28752.png', description:'A polished pricing layout concept for a cakes, pastries, and catering business.' },
    { title:'Provisions Store Campaign', type:'Advertising Flyer', tag:'Advertising', imageUrl:'/resources/28665.png', description:'A bright promotional flyer designed to present everyday provisions, products, and a clear customer call to action.' },
    { title:'Daily Needs Product Flyer', type:'Product Promotion', tag:'Product', imageUrl:'/resources/28675.jpg', description:'A product-focused promotional composition built around groceries, drinks, snacks, and daily essentials.' },
    { title:'Creative Studio Portfolio', type:'Studio Presentation', tag:'Portfolio', imageUrl:'/resources/28504.png', description:'A portfolio-style presentation showing studio positioning, services, and selected client work.' },
    { title:'Wycliffe Creative Studio Services', type:'Services & Brand Promotion', tag:'Services', imageUrl:'/resources/28512.png', description:'A service-promotion graphic covering graphic design, event flyers, wedding posters, branding, print materials, and custom designs.' },
    { title:'Tinamens Couture', type:'Fashion Campaign Flyer', tag:'Fashion', imageUrl:'/resources/28431.png', description:'An elegant fashion campaign layout combining couture imagery, service information, and a premium visual direction.' },
    { title:'LexaTech Solutions — Blue', type:'Technology Advertising Design', tag:'Technology', imageUrl:'/resources/28424.png', description:'A technology-focused promotional design for computers, displays, audio, accessories, and support services.' },
    { title:'LexaTech Solutions — Red', type:'Technology Advertising Design', tag:'Technology', imageUrl:'/resources/28345.png', description:'A bold technology campaign design presenting products, service categories, value propositions, and a strong call to action.' },
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
    readSection('hero'), readSection('about'), readSection('contact'),
    readCollection('services'), readCollection('pricing'), readCollection('projects'),
  ]);
  const content = structuredClone(defaultContent);
  if (hero) Object.assign(content, { heroEyebrow: hero.eyebrow ?? content.heroEyebrow, heroTitle: hero.headline ?? content.heroTitle, heroEmphasis: hero.emphasis ?? content.heroEmphasis, heroDescription: hero.subheadline ?? content.heroDescription });
  if (about) Object.assign(content, { aboutParagraph1: about.text ?? content.aboutParagraph1, aboutTitle: about.title ?? content.aboutTitle, aboutParagraph2: about.text2 ?? content.aboutParagraph2, clientTypes: about.clientTypes ?? content.clientTypes });
  if (contact) Object.assign(content, { email: contact.email ?? content.email, phone: contact.phone ?? content.phone, whatsapp: contact.whatsapp ?? content.whatsapp, instagram: contact.instagram ?? content.instagram, contactTitle: contact.title ?? content.contactTitle, contactDescription: contact.description ?? content.contactDescription });
  if (services.length) content.services = services.map((s: any) => ({ id:s.id, title:s.name ?? s.title ?? '', text:s.description ?? s.text ?? '', order:Number(s.order ?? 0) }));
  if (prices.length) content.prices = prices.map((p: any) => ({ id:p.id, title:p.packageName ?? p.title ?? '', description:p.description ?? '', price:p.price ?? '', order:Number(p.order ?? 0) }));
  if (projects.length) content.projects = projects.map((p: any) => ({ id:p.id, title:p.title ?? '', type:p.category ?? '', tag:p.category ?? '', description:p.description ?? '', imageUrl:p.imageUrl ?? '' }));
  siteWhatsapp = content.whatsapp || defaultContent.whatsapp;
  return content;
}

export function applySiteContent(content: EditableContent) {
  siteWhatsapp = content.whatsapp || defaultContent.whatsapp;
  const heroEyebrow = document.querySelector('.hero-copy .eyebrow');
  if (heroEyebrow) heroEyebrow.replaceChildren(heroEyebrow.querySelector('span') || document.createElement('span'), document.createTextNode(' ' + content.heroEyebrow));
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) { const br=document.createElement('br'); const em=document.createElement('em'); em.textContent=content.heroEmphasis; heroTitle.replaceChildren(document.createTextNode(content.heroTitle),br,em,document.createTextNode(' stand out.')); }
  const text = (selector:string,value:string) => { const el=document.querySelector(selector); if(el) el.textContent=value; };
  text('.hero-copy > p', content.heroDescription); text('.statement p', content.statementLabel); text('.statement h2', content.statement);
  document.querySelectorAll('.project').forEach((card,i)=>{const p=content.projects[i];if(!p)return;const t=card.querySelector('.project-meta strong');const ty=card.querySelector('.project-meta span');const tag=card.querySelector('.project-image-label');if(t)t.textContent=p.title;if(ty)ty.textContent=p.type;if(tag)tag.textContent=p.tag;const img=card.querySelector('img');if(img&&p.imageUrl)img.setAttribute('src',p.imageUrl);});
  document.querySelectorAll('.service').forEach((card,i)=>{const s=content.services[i];if(!s)return;const h=card.querySelector('h3');const p=card.querySelector('p');if(h)h.textContent=s.title;if(p)p.textContent=s.text;});
  document.querySelectorAll('.price-card').forEach((card,i)=>{const p=content.prices[i];if(!p)return;const h=card.querySelector('h3');const d=card.querySelector('p');const price=card.querySelector('strong');if(h)h.textContent=p.title;if(d)d.textContent=p.description;if(price)price.textContent=p.price;});
  text('.about-copy h2', content.aboutTitle); text('.about-copy > p:nth-of-type(1)', content.aboutParagraph1); text('.about-copy > p:nth-of-type(2)', content.aboutParagraph2);
  const types=document.querySelector('.client-types');if(types)types.replaceChildren(...content.clientTypes.map(item=>{const span=document.createElement('span');span.textContent=item;return span;}));
  text('.contact h2',content.contactTitle);text('.contact-inner > p',content.contactDescription);
  document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{a.setAttribute('href','mailto:'+content.email);if(a.textContent?.includes('@'))a.textContent=content.email;});
  const details=document.querySelectorAll('.contact-details a');if(details[0]){details[0].textContent=content.email;details[0].setAttribute('href','mailto:'+content.email);}if(details[1]){details[1].textContent=content.phone;details[1].setAttribute('href','tel:+233'+content.phone.replace(/^0/,'').replace(/^\+233/,''));}
  document.querySelectorAll('a[href*="wa.me/"]').forEach(a=>a.setAttribute('href','https://wa.me/'+content.whatsapp));
  document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.setAttribute('href','tel:+233'+content.phone.replace(/^0/,'').replace(/^\+233/,'')));
  const instagram=document.querySelector('.socials a[href*="instagram"]');if(instagram)instagram.setAttribute('href',content.instagram);
}
