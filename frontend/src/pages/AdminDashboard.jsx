import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { ArrowUpRight, BarChart3, CreditCard, ExternalLink, LogOut, Menu, Package, Settings, ShoppingBag, Users, X, RefreshCw, Truck, FileText, ShieldCheck, Star, MessageCircle, Mail } from 'lucide-react';

const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(value)||0);
const modules = [
  {label:'Product & sizes',desc:'Project 001 details and size-wise stock',path:'/admin/edit-menu',icon:Package},
  {label:'Orders',desc:'Review, process and fulfil customer orders',path:'/admin/orders',icon:ShoppingBag},
  {label:'Revenue',desc:'Sales performance and payment summaries',path:'/admin/revenue',icon:BarChart3},
  {label:'Customers',desc:'Find customers and view order history',path:'/admin/customer-search',icon:Users},
  {label:'Payments',desc:'Transactions and payment records',path:'/admin/payments',icon:CreditCard},
  {label:'Returns & exchanges',desc:'Handle size exchanges and return requests',path:'/admin/returns',icon:RefreshCw},
  {label:'Delivery management',desc:'Delivery details and fulfilment information',path:'/admin/delivery',icon:Truck},
  {label:'Bill generator',desc:'Create and print customer invoices',path:'/admin/bills',icon:FileText},
  {label:'Permissions',desc:'Manage admin access and roles',path:'/admin/permissions',icon:ShieldCheck},
  {label:'Reviews',desc:'Moderate product reviews and ratings',path:'/admin/reviews',icon:Star},
  {label:'Customer support',desc:'Resolve customer support requests',path:'/admin/support',icon:MessageCircle},
  {label:'Reach out',desc:'Manage customer enquiries and messages',path:'/admin/reach-out',icon:Mail},
  {label:'Store settings',desc:'Shipping, coupons and store configuration',path:'/admin/settings',icon:Settings}
];

export default function AdminDashboard(){
  const navigate=useNavigate();
  const {logout,user}=useContext(AuthContext);
  const [orders,setOrders]=useState([]);
  const [products,setProducts]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [menuOpen,setMenuOpen]=useState(false);

  const load=async()=>{
    setLoading(true);setError('');
    const results=await Promise.allSettled([API.get('/orders'),API.get('/products?all=true'),API.get('/admin/users')]);
    if(results[0].status==='fulfilled')setOrders(Array.isArray(results[0].value.data)?results[0].value.data:[]);
    if(results[1].status==='fulfilled')setProducts(Array.isArray(results[1].value.data)?results[1].value.data:[]);
    if(results[2].status==='fulfilled')setCustomers(Array.isArray(results[2].value.data)?results[2].value.data:[]);
    if(results.every(r=>r.status==='rejected'))setError('Could not load dashboard data. Check your backend connection and admin access.');
    setLoading(false);
  };
  useEffect(()=>{load();},[]);
  const pending=orders.filter(o=>['Placed','Processing','Preparing'].includes(o.status));
  const revenue=orders.filter(o=>!['Cancelled','Failed','Refunded'].includes(o.status)).reduce((sum,o)=>sum+Number(o.totalPrice||0),0);
  const units=products.reduce((sum,p)=>sum+(Array.isArray(p.variants)?p.variants.reduce((s,v)=>s+Number(v.stock||0),0):Number(p.stock||0)),0);
  const recent=useMemo(()=>[...orders].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5),[orders]);
  const firstName=user?.firstName||user?.name||'Admin';

  return <div className="ec-admin">
    <header className="ec-admin-header">
      <button className="ec-admin-brand" onClick={()=>navigate('/')}><span className="ec-admin-mark">EC</span><span>ECHO CHASING<small>ADMIN WORKSPACE</small></span></button>
      <button className="ec-admin-menu" onClick={()=>setMenuOpen(v=>!v)} aria-label="Toggle menu">{menuOpen?<X/>:<Menu/>}</button>
      <nav className={menuOpen?'ec-admin-nav open':'ec-admin-nav'}>
        <button onClick={()=>navigate('/')}>VIEW STOREFRONT <ExternalLink size={14}/></button>
        <button onClick={load}>REFRESH DATA <RefreshCw size={14}/></button>
        <button className="ec-admin-logout" onClick={()=>{logout();navigate('/');}}><LogOut size={15}/> LOG OUT</button>
      </nav>
    </header>
    <main className="ec-admin-main">
      <div className="ec-admin-welcome"><div><span className="ec-admin-eyebrow">CONTROL ROOM / 001</span><h1>Good to see you, {firstName}.</h1><p>One product. One first drop. Every detail in your hands.</p></div><div className="ec-admin-drop"><span className="ec-live-dot"/> FIRST DROP <strong>LIVE WORKSPACE</strong></div></div>
      {error&&<div className="ec-admin-error">{error}</div>}
      <section className="ec-admin-kpis">
        {[{label:'TOTAL REVENUE',value:loading?'—':money(revenue),note:'From recorded orders',icon:BarChart3},{label:'ORDERS TO PROCESS',value:loading?'—':pending.length,note:'Placed, processing or preparing',icon:ShoppingBag},{label:'PRODUCTS IN STORE',value:loading?'—':products.length,note:'Current catalogue',icon:Package},{label:'CUSTOMERS',value:loading?'—':customers.length,note:'Registered customer accounts',icon:Users}].map((item,i)=><article className="ec-admin-kpi" key={item.label}><div className="ec-admin-kpi-top"><span>{item.label}</span><item.icon size={18}/></div><strong>{item.value}</strong><small>{item.note}</small></article>)}
      </section>
      <section className="ec-admin-stock">
        <div><span className="ec-admin-eyebrow">PROJECT 001 / INVENTORY SNAPSHOT</span><h2>First drop inventory</h2><p>Keep an eye on available units across every size.</p></div>
        <div className="ec-admin-stock-total"><strong>{loading?'—':units}</strong><span>UNITS RECORDED</span><button onClick={()=>navigate('/admin/edit-menu')}>MANAGE STOCK <ArrowUpRight size={15}/></button></div>
      </section>
      <section className="ec-admin-section-head"><div><span className="ec-admin-eyebrow">YOUR STORE TOOLS</span><h2>Manage the business</h2></div><span>{String(modules.length).padStart(2,'0')} MODULES</span></section>
      <section className="ec-admin-modules">{modules.map(({label,desc,path,icon:Icon},i)=><button className="ec-admin-module" key={path} onClick={()=>navigate(path)}><span className="ec-admin-module-index">0{i+1}</span><span className="ec-admin-module-icon"><Icon size={20}/></span><span className="ec-admin-module-copy"><strong>{label}</strong><small>{desc}</small></span><ArrowUpRight className="ec-admin-module-arrow" size={18}/></button>)}</section>
      <section className="ec-admin-recent"><div className="ec-admin-section-head"><div><span className="ec-admin-eyebrow">LATEST ACTIVITY</span><h2>Recent orders</h2></div><button onClick={()=>navigate('/admin/orders')}>ALL ORDERS <ArrowUpRight size={15}/></button></div>
        {loading?<p className="ec-admin-empty">Loading order activity…</p>:recent.length===0?<p className="ec-admin-empty">No orders yet. Your first customer order will appear here.</p>:<div className="ec-admin-table-wrap"><table className="ec-admin-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{recent.map((o,i)=><tr key={o._id||i}><td>#{String(o._id||'').slice(-6).toUpperCase()||'—'}</td><td>{o.user?.firstName||o.shippingAddress?.name||o.customerName||'Customer'}</td><td>{o.createdAt?new Date(o.createdAt).toLocaleDateString('en-IN'):'—'}</td><td>{money(o.totalPrice)}</td><td><span className="ec-admin-status">{o.status||'Placed'}</span></td></tr>)}</tbody></table></div>}
      </section>
      <footer className="ec-admin-footer"><span>© {new Date().getFullYear()} ECHO CHASING</span><span>BUILT ONE DROP AT A TIME.</span></footer>
    </main>
  </div>;
}
