import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Instagram } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  return <footer className="ec-footer">
    <div className="ec-footer-main">
      <div><button className="ec-footer-logo" onClick={() => navigate('/')}>ECHO<br /><i>CHASING.</i></button><p>For the ones who take their own way.</p></div>
      <div className="ec-footer-links"><span>EXPLORE</span><button onClick={() => navigate('/')}>The first drop <ArrowUpRight size={14}/></button><button onClick={() => navigate('/our-story')}>Our story <ArrowUpRight size={14}/></button><button onClick={() => navigate('/contact')}>Get in touch <ArrowUpRight size={14}/></button></div>
      <div className="ec-footer-links"><span>FOLLOW THE SIGNAL</span><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <Instagram size={15}/></a><a href="mailto:hello@echochasing.com">hello@echochasing.com <ArrowUpRight size={14}/></a></div>
    </div>
    <div className="ec-footer-bottom"><span>© {new Date().getFullYear()} ECHO CHASING. ALL RIGHTS RESERVED.</span><span>MADE TO MOVE DIFFERENT.</span><button onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>BACK TO TOP ↑</button></div>
  </footer>;
}
