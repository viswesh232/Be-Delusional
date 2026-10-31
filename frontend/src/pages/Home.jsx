import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getImageUrl } from '../utils/helpers';

const fallbackProduct = {
  _id: null,
  name: 'Project 001 — Oversized Tee',
  price: 1499,
  category: 'First Drop',
  description: 'The first piece. Made to move with you.',
  images: [],
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  fabric: 'Cotton'
};

export default function Home() {
  const navigate = useNavigate();
  const [product, setProduct] = useState(fallbackProduct);
  const [productLoaded, setProductLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    API.get('/products').then(({ data }) => {
      if (!active || !Array.isArray(data) || !data.length) return;
      const first = data[0];
      setProduct({ ...fallbackProduct, ...first, name: first.name || fallbackProduct.name });
      setProductLoaded(true);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const image = product.images?.[0] || product.image;
  const availableSizes = Array.isArray(product.sizes) ? product.sizes : fallbackProduct.sizes;
  const salePrice = product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price;
  const openProduct = () => {
    if (product._id) navigate(`/product/${product.slug || product._id}`);
    else document.getElementById('project-001')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="ec-home">
      <section className="ec-hero">
        <div className="ec-hero-grain" />
        <div className="ec-hero-top"><span>Independent clothing label</span><span>Est. 2026 · India</span></div>
        <div className="ec-hero-copy">
          <p className="ec-kicker"><span className="ec-live-dot" /> THE FIRST CHAPTER STARTS HERE</p>
          <h1>DON'T JUST<br /><em>FOLLOW</em><br />THE NOISE.</h1>
          <div className="ec-hero-bottom">
            <p>Clothes for the ones who take their own way.<br />Less noise. More meaning. Always moving.</p>
            <button className="ec-circle-cta" onClick={openProduct} aria-label="Explore Project 001"><ArrowDownRight size={27} /></button>
          </div>
        </div>
        <div className="ec-hero-index"><span>01 / 01</span><span>PROJECT 001 — FIRST DROP</span></div>
      </section>

      <section className="ec-intro">
        <div className="ec-section-label">[ A NOTE FROM ECHO CHASING ]</div>
        <div className="ec-intro-copy"><h2>WEAR YOUR<br /><span>OWN FREQUENCY.</span></h2><p>Echo Chasing is for people who don't need permission to be different. We are starting small, making every piece count, and building this one drop at a time.</p></div>
      </section>

      <section className="ec-product-section" id="project-001">
        <div className="ec-product-heading"><div><span className="ec-section-label">[ THE FIRST RELEASE ]</span><h2>PROJECT <i>001</i></h2></div><span className="ec-drop-tag">LIMITED FIRST DROP <span>↗</span></span></div>
        <div className="ec-product-grid">
          <button className="ec-product-visual" onClick={openProduct} aria-label="View Project 001">
            {image ? <img src={getImageUrl(image)} alt="Project 001 oversized T-shirt" /> : <div className="ec-product-placeholder"><span>EC / 001</span><div className="ec-shirt-shape"><span>ECHO<br />CHASING</span></div><small>PRODUCT IMAGE WILL APPEAR HERE</small></div>}
            <span className="ec-image-stamp">DROP<br />NO. 001</span>
          </button>
          <div className="ec-product-info">
            <div className="ec-product-meta"><span>ECH — 001</span><span>01 / 01</span></div>
            <p className="ec-kicker">THE ONE THAT STARTED IT</p>
            <h3>{product.name}</h3>
            <p className="ec-price">₹{Number(salePrice || 1499).toLocaleString('en-IN')} {product.discountPrice > 0 && product.discountPrice < product.price ? <del>₹{Number(product.price).toLocaleString('en-IN')}</del> : null} <small>INCLUSIVE OF TAXES</small></p>
            <p className="ec-product-desc">{product.description || 'An everyday essential with an oversized silhouette. Built around comfort, simplicity and a little bit of defiance.'}</p>
            <div className="ec-spec-row"><span>FABRIC</span><strong>{product.material || product.fabric || 'Cotton'}</strong></div>
            <div className="ec-spec-row"><span>FIT</span><strong>{product.fit || 'OVERSIZED / UNISEX'}</strong></div>
            <div className="ec-size-block"><span>AVAILABLE SIZES</span><div>{availableSizes.map(size => <span key={size}>{size}</span>)}</div></div>
            <button className="ec-add-button" onClick={openProduct}>{productLoaded ? 'VIEW PRODUCT' : 'DISCOVER PROJECT 001'} <ArrowUpRight size={18} /></button>
            <p className="ec-stock-note"><span className="ec-live-dot" /> {product.isAvailable === false ? 'CURRENTLY UNAVAILABLE' : 'LIMITED QUANTITY · FIRST DROP'}</p>
          </div>
        </div>
      </section>

      <section className="ec-manifesto">
        <span className="ec-section-label">[ OUR POINT OF VIEW ]</span>
        <h2>NOT MADE FOR<br />EVERYONE.<br /><em>MADE TO BE YOURS.</em></h2>
        <div className="ec-manifesto-foot"><span>NO. 001 — THE BEGINNING</span><p>One product. One purpose. A whole lot more to come.</p></div>
      </section>

      <section className="ec-bottom-cta"><div><span className="ec-section-label">[ THE JOURNEY BEGINS ]</span><h2>CHASE<br /><em>YOUR ECHO.</em></h2></div><button onClick={openProduct}>SHOP THE FIRST DROP <ArrowUpRight size={18} /></button></section>
    </div>
  );
}
