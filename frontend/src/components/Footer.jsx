import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  return <footer className="ec-footer">
    <div className="ec-footer-main">
      <div><button className="ec-footer-logo" onClick={() => navigate('/')}>ECHO<br /><i>CHASING.</i></button><p>For the ones who take their own way.</p></div>
      <div className="ec-footer-links"><span>EXPLORE</span><button onClick={() => navigate('/')}>The first drop <ArrowUpRight size={14}/></button><button onClick={() => navigate('/our-story')}>Our story <ArrowUpRight size={14}/></button><button onClick={() => navigate('/contact')}>Get in touch <ArrowUpRight size={14}/></button></div>
      <div className="ec-footer-links"><span>FOLLOW THE SIGNAL</span><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg></a><a href="mailto:hello@echochasing.com">hello@echochasing.com <ArrowUpRight size={14}/></a></div>
    </div>
    <div className="ec-footer-bottom"><span>© {new Date().getFullYear()} ECHO CHASING. ALL RIGHTS RESERVED.</span><span>MADE TO MOVE DIFFERENT.</span><button onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>BACK TO TOP ↑</button></div>
  </footer>;
}
