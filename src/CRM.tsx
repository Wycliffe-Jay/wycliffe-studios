import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChartNoAxesCombined, CircleDollarSign, ClipboardList, KanbanSquare, Plus, RefreshCw, Search, Users, X, Trash2 } from 'lucide-react';
import './crm.css';

type AnyRow = Record<string, any> & { id: string };
type Page = 'Overview'|'Clients'|'Inquiries'|'Sales Pipeline'|'Projects'|'Payments'|'Follow-ups'|'Reports';
const pages: Page[] = ['Overview','Clients','Inquiries','Sales Pipeline','Projects','Payments','Follow-ups','Reports'];

const config: Record<'Clients'|'Projects'|'Payments'|'Follow-ups', {
  table:string; title:string; fields:[string,string,'client'|'project'|undefined][]; statuses?:string[]
}> = {
  Clients:{
    table:'Clients', title:'Clients',
    fields:[
      ['client_name','Client name',undefined],['company','Company',undefined],['phone','Phone',undefined],
      ['email','Email',undefined],['status','Status',undefined],['notes','Notes',undefined]
    ],
    statuses:['Prospect','Active','Inactive']
  },
  Projects:{
    table:'Projects', title:'Projects',
    fields:[
      ['project_name','Project name',undefined],['status','Status',undefined],['deadline','Deadline',undefined],
      ['deliverables','Deliverables',undefined],['project_value','Project value',undefined],['client','Client','client'],
      ['started_date','Started date',undefined],['completed_date','Completed date',undefined],['notes','Notes',undefined]
    ],
    statuses:['Planning','In Progress','On Hold','Completed','Cancelled']
  },
  Payments:{
    table:'Payments', title:'Payments',
    fields:[
      ['payment_amount','Payment amount',undefined],['payment_date','Payment date',undefined],
      ['deposit_amount','Deposit amount',undefined],['payment_type','Payment type',undefined],
      ['project','Project','project'],['client','Client','client'],['notes','Notes',undefined]
    ],
    statuses:['Recorded','Voided']
  },
  'Follow-ups':{
    table:'Follow-ups', title:'Follow-ups',
    fields:[
      ['follow_up_name','Follow-up name',undefined],['follow_up_date','Follow-up date',undefined],
      ['follow_up_notes','Follow-up notes',undefined],['status','Status',undefined],['client','Client','client']
    ],
    statuses:['Pending','In Progress','Completed','Cancelled','Scheduled']
  }
};

const money = (v:number) => 'GH₵'+Number(v||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
const date = (v:any) => v ? new Date(v).toLocaleDateString('en-GB') : '—';
const isoDate = (v:any) => v ? String(v).slice(0,10) : '';

async function api(table:string, method:'GET'|'POST'|'PATCH'|'DELETE'='GET', body?:any) {
  const options: RequestInit = { method, headers:{'Content-Type':'application/json'} };
  if (body !== undefined) options.body = JSON.stringify(body);
  const response = await fetch('/api/airtable?table='+encodeURIComponent(table), options);
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data?.error || 'Airtable request failed.');
  return data;
}

export default function CRM({onClose,initialPage='Overview'}:{onClose:()=>void;initialPage?:Page}) {
  const [page,setPage]=useState<Page>(initialPage);
  const [clients,setClients]=useState<AnyRow[]>([]);
  const [projects,setProjects]=useState<AnyRow[]>([]);
  const [payments,setPayments]=useState<AnyRow[]>([]);
  const [followups,setFollowups]=useState<AnyRow[]>([]);
  const [activities,setActivities]=useState<AnyRow[]>([]);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [query,setQuery]=useState(''),[editing,setEditing]=useState<AnyRow|null>(null),[creating,setCreating]=useState(false);

  const load = async() => {
    setBusy(true); setError('');
    try {
      const [c,p,pay,f] = await Promise.all([
        api('Clients'),api('Projects'),api('Payments'),api('Follow-ups')
      ]);
      setClients(c.records||[]); setProjects(p.records||[]); setPayments(pay.records||[]); setFollowups(f.records||[]);
      const events = [
        ...(c.records||[]).map((r:any)=>({id:r.id,description:'Client: '+r.client_name,created:r.created_time})),
        ...(p.records||[]).map((r:any)=>({id:r.id,description:'Project: '+r.project_name,created:r.started_date})),
        ...(pay.records||[]).map((r:any)=>({id:r.id,description:'Payment: '+money(r.payment_amount),created:r.created_time||r.payment_date})),
        ...(f.records||[]).map((r:any)=>({id:r.id,description:'Follow-up: '+r.follow_up_name,created:r.created_time||r.follow_up_date}))
      ];
      setActivities(events.sort((a,b)=>new Date(b.created||0).getTime()-new Date(a.created||0).getTime()).slice(0,20));
    } catch(e:any) {
      setError(e?.message||'Could not load Airtable CRM.');
    } finally { setBusy(false); }
  };

  useEffect(()=>{void load()},[]);
  useEffect(()=>{setPage(initialPage)},[initialPage]);

  const selectedClient=(id:string)=>clients.find(c=>c.id===id);
  const selectedProject=(id:string)=>projects.find(p=>p.id===id);
  const paid=(id:string)=>payments.filter(p=>p.project===id).reduce((s,p)=>s+Number(p.payment_amount||0),0);
  const revenue=payments.reduce((s,p)=>s+Number(p.payment_amount||0),0);
  const outstanding=projects.reduce((s,p)=>s+Math.max(0,Number(p.project_value||0)-paid(p.id)),0);
  const due=followups.filter(f=>['Pending','Scheduled','In Progress'].includes(f.status)&&new Date(f.follow_up_date)<new Date(new Date().toDateString()));
  const today=followups.filter(f=>['Pending','Scheduled','In Progress'].includes(f.status)&&new Date(f.follow_up_date).toDateString()===new Date().toDateString());

  const record=(p:Page)=>{setPage(p);setQuery('');setEditing(null);setCreating(false)};
  const notify=(msg:string)=>{setNotice(msg);setTimeout(()=>setNotice(''),2500)};

  const save=async(row:AnyRow) => {
    if (page==='Inquiries'||page==='Sales Pipeline'||page==='Reports'||page==='Overview') return;
    const c=config[page as keyof typeof config]; if(!c)return;
    const fields:Record<string,any>={};
    c.fields.forEach(([key])=>{
      let value=row[key];
      if(['project_value','payment_amount','deposit_amount'].includes(key)) value=value===''||value==null?null:Number(value);
      if(['deadline','started_date','completed_date','payment_date','follow_up_date'].includes(key)) value=value||null;
      fields[key]=value??null;
    });
    if(page==='Clients'&&!String(fields.client_name||'').trim()){setError('Client name is required.');return;}
    if(page==='Projects'&&(!String(fields.project_name||'').trim()||!fields.client)){setError('Project name and client are required.');return;}
    if(page==='Payments'&&(!fields.project||!fields.client||Number(fields.payment_amount)<=0)){setError('Choose a project and client and enter a valid payment amount.');return;}
    if(page==='Follow-ups'&&!String(fields.follow_up_name||'').trim()){setError('Follow-up name is required.');return;}
    setBusy(true);setError('');
    try {
      await api(c.table,row.id?'PATCH':'POST',row.id?{id:row.id,fields}:{fields});
      notify('Saved successfully.');
      setEditing(null);setCreating(false);await load();
    } catch(e:any){setError(e?.message||'Could not save record.');}
    finally{setBusy(false);}
  };

  const create=()=>{
    const c=config[page as keyof typeof config]; if(!c)return;
    const blank:AnyRow={id:''};
    c.fields.forEach(([key])=>blank[key]=key==='status'?c.statuses?.[0]||'Recorded':'');
    if(page==='Payments') { blank.payment_date=new Date().toISOString().slice(0,10); blank.payment_type='Mobile Money'; }
    if(page==='Follow-ups') { blank.follow_up_date=new Date().toISOString().slice(0,16); blank.status='Scheduled'; }
    setEditing(blank);setCreating(true);
  };

  const removeRecord=async(r:AnyRow)=>{
    if(!confirm('Permanently delete this record? This cannot be undone.'))return;
    const c=config[page as keyof typeof config];if(!c)return;
    setBusy(true);setError('');
    try{await api(c.table,'DELETE',{id:r.id});notify('Record deleted.');await load();}
    catch(e:any){setError(e?.message||'Could not delete record.');}
    finally{setBusy(false);}
  };

  const contact=(phone:string)=>{if(phone)window.open('https://wa.me/'+String(phone).replace(/\D/g,''),'_blank','noopener,noreferrer')};

  const rows = page==='Clients'?clients:page==='Projects'?projects:page==='Payments'?payments:followups;
  const filtered = useMemo(()=>rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase())),[rows,query]);

  const exportCsv=()=>{
    const data=filtered;
    const keys=Array.from(new Set(data.flatMap(r=>Object.keys(r))));
    const csv=[keys.join(','),...data.map(r=>keys.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='wycliffe-'+page.toLowerCase().replaceAll(' ','-')+'.csv';a.click();URL.revokeObjectURL(a.href);
  };

  return <div className="crm-shell">
    <div className="crm-heading"><div><small>WYCLIFFE STUDIOS / BUSINESS</small><h2>Client Management</h2><p>Keep your clients, projects and payments in one place.</p></div><div className="crm-head-actions"><button onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button><button onClick={onClose}><X size={16}/> Website editor</button></div></div>
    <nav className="crm-tabs">{pages.map((p,i)=><button key={p} className={page===p?'active':''} onClick={()=>record(p)}>{[<ChartNoAxesCombined/>,<Users/>,<ClipboardList/>,<KanbanSquare/>,<ClipboardList/>,<CircleDollarSign/>,<CalendarClock/>,<ChartNoAxesCombined/>][i]}{p}</button>)}</nav>
    {error&&<div className="crm-error">{error}</div>}{notice&&<div className="crm-success">{notice}</div>}

    {page==='Overview'&&<><div className="crm-metrics">
      {[['Total Clients',clients.length],['Active Projects',projects.filter(p=>['Planning','In Progress','On Hold'].includes(p.status)).length],['Pending Payments',money(outstanding)],['Revenue',money(revenue)],['Completed Projects',projects.filter(p=>p.status==='Completed').length],['Follow-ups Due',due.length+today.length]].map(([l,v])=><article key={String(l)}><small>{l}</small><strong>{v}</strong></article>)}
    </div><div className="crm-columns"><section className="crm-panel"><h3>Follow-ups due</h3>{[...due,...today].length?[...due,...today].map(f=><p key={f.id}><b>{f.follow_up_name}</b><small>{date(f.follow_up_date)} · {selectedClient(f.client)?.client_name||'Client'}</small></p>):<p className="crm-muted">No follow-ups due.</p>}</section><section className="crm-panel"><h3>Recent activity</h3>{activities.slice(0,8).map(a=><p key={a.id}><b>{a.description}</b><small>{date(a.created)}</small></p>)}{!activities.length&&<p className="crm-muted">Activity will appear as you add records.</p>}</section></div><div className="crm-quick">{(['Clients','Projects','Payments','Follow-ups'] as Page[]).map(p=><button key={p} onClick={()=>{record(p);setTimeout(()=>document.querySelector('.crm-create')?.dispatchEvent(new MouseEvent('click',{bubbles:true})),0)}}><Plus size={16}/> Add {p==='Follow-ups'?'Follow-up':p.slice(0,-1)}</button>)}</div></>}

    {page==='Reports'&&<><div className="crm-metrics"><article><small>Total received</small><strong>{money(revenue)}</strong></article><article><small>Outstanding</small><strong>{money(outstanding)}</strong></article><article><small>Clients</small><strong>{clients.length}</strong></article><article><small>Projects</small><strong>{projects.length}</strong></article></div><section className="crm-panel"><div className="crm-table-head"><h3>Revenue by project</h3><button onClick={exportCsv}>Export CSV</button></div>{projects.map(p=><p key={p.id}><b>{p.project_name}</b><small>{selectedClient(p.client)?.client_name||'—'} · Received {money(paid(p.id))} · Value {money(p.project_value)}</small></p>)}</section></>}

    {(page==='Inquiries'||page==='Sales Pipeline')&&<section className="crm-panel"><h3>{page}</h3><p className="crm-muted">This Airtable setup currently has no Inquiries table, so this section is left empty rather than inventing or duplicating data.</p></section>}

    {config[page as keyof typeof config]&&<section className="crm-panel"><div className="crm-table-head"><div><h3>{config[page as keyof typeof config].title}</h3><small>{filtered.length} records</small></div><div className="crm-controls"><label><Search size={16}/><input placeholder="Search records..." value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="crm-create" onClick={create}><Plus size={16}/> Add {config[page as keyof typeof config].title.slice(0,-1)}</button><button onClick={exportCsv}>Export</button></div></div>
      <div className="crm-table-wrap"><table><thead><tr>{(page==='Clients'?['Name','Company','Phone','Status']:page==='Projects'?['Project','Client','Value','Paid','Balance','Status','Deadline']:page==='Payments'?['Date','Client','Project','Amount','Type']:['Follow-up','Client','Date','Status']).map(h=><th key={h}>{h}</th>)}<th>Actions</th></tr></thead>
      <tbody>{filtered.map(r=><tr key={r.id}>
        {page==='Clients'?<><td>{r.client_name}</td><td>{r.company||'—'}</td><td>{r.phone||'—'}</td><td>{r.status||'—'}</td></>:
         page==='Projects'?<><td>{r.project_name}</td><td>{selectedClient(r.client)?.client_name||'—'}</td><td>{money(r.project_value)}</td><td>{money(paid(r.id))}</td><td>{money(Math.max(0,Number(r.project_value||0)-paid(r.id)))}</td><td>{r.status||'—'}</td><td>{date(r.deadline)}</td></>:
         page==='Payments'?<><td>{date(r.payment_date)}</td><td>{selectedClient(r.client)?.client_name||'—'}</td><td>{selectedProject(r.project)?.project_name||'—'}</td><td>{money(r.payment_amount)}</td><td>{r.payment_type||'—'}</td></>:
         <><td>{r.follow_up_name}</td><td>{selectedClient(r.client)?.client_name||'—'}</td><td>{date(r.follow_up_date)}</td><td>{r.status||'—'}</td></>}
        <td className="crm-row-actions"><button onClick={()=>setEditing({...r})}>Edit</button><button className="crm-delete" onClick={()=>void removeRecord(r)} title="Permanently delete"><Trash2 size={14}/> Delete</button>{page==='Clients'&&<button onClick={()=>contact(r.phone)}>WhatsApp</button>}</td>
      </tr>)}</tbody></table></div>{!filtered.length&&<p className="crm-muted">No records yet.</p>}</section>}

    {editing&&config[page as keyof typeof config]&&<div className="crm-modal-backdrop"><form className="crm-modal" onSubmit={e=>{e.preventDefault();void save(editing)}}><div className="crm-modal-head"><h3>{creating?'Add':'Edit'} {config[page as keyof typeof config].title}</h3><button type="button" onClick={()=>setEditing(null)}><X/></button></div>
      {config[page as keyof typeof config].fields.map(([key,label,type])=><label className="crm-field" key={key}><span>{label}</span>
        {type==='client'?<select value={editing[key]||''} onChange={e=>setEditing({...editing,[key]:e.target.value})} required><option value="">Choose client</option>{clients.map(c=><option value={c.id} key={c.id}>{c.client_name}</option>)}</select>:
         type==='project'?<select value={editing[key]||''} onChange={e=>setEditing({...editing,[key]:e.target.value})} required><option value="">Choose project</option>{projects.map(p=><option value={p.id} key={p.id}>{p.project_name}</option>)}</select>:
         key==='status'?<select value={editing[key]||''} onChange={e=>setEditing({...editing,[key]:e.target.value})}>{config[page as keyof typeof config].statuses?.map(s=><option key={s}>{s}</option>)}</select>:
         <input type={['deadline','started_date','completed_date','payment_date'].includes(key)?'date':['project_value','payment_amount','deposit_amount'].includes(key)?'number':'text'} step={['project_value','payment_amount','deposit_amount'].includes(key)?'0.01':undefined} value={editing[key]??''} onChange={e=>setEditing({...editing,[key]:e.target.value})}/>}
      </label>)}<div className="crm-modal-actions"><button type="button" onClick={()=>setEditing(null)}>Cancel</button><button className="crm-primary" disabled={busy}>{busy?'Saving...':'Save record'}</button></div></form></div>}
    {busy&&<div className="crm-loading">Working…</div>}
  </div>;
}
