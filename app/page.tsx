'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Product type
interface Product {
  id: number;
  nameEn: string;
  nameKh: string;
  brand: string;
  category: string;
  price: number;
  sale: number | null;
  badge: string | null;
  emoji: string;
  stock: number;
  imgs: string[];
}

interface CartItem extends Product {
  qty: number;
}

const initialProducts: Product[] = [
  {id:1,nameEn:'Luminous Glow Serum',nameKh:'\u179F\u17C1\u179A\u17C9\u17BC\u1798\u1798\u1793\u17CB\u17A0\u179A',brand:'LANEIGE',category:'skincare',price:48,sale:null,badge:'bestseller',emoji:'\u{1F33F}',stock:25,imgs:['https://images.unsplash.com/photo-1617897903246-719242758050?w=600&q=80&fit=crop']},
  {id:2,nameEn:'Velvet Lip Tint',nameKh:'\u1787\u17D2\u179A\u17BC\u1780\u179A\u1794\u1794\u17BC\u179A',brand:'ROM&ND',category:'makeup',price:18,sale:12,badge:'sale',emoji:'\u{1F484}',stock:40,imgs:['https://images.unsplash.com/photo-1631214524020-3c69d4c08b2f?w=600&q=80&fit=crop']},
  {id:3,nameEn:'Rose Mist Perfume',nameKh:'\u1794\u17D2\u179A\u17A1\u17B6\u1780\u17CB\u17A2\u1794\u17CB\u1780\u17BB\u179B\u17B6\u1794\u179F',brand:'DIPTYQUE',category:'fragrance',price:95,sale:null,badge:'new',emoji:'\u{1F338}',stock:5,imgs:['https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600&q=80&fit=crop']},
  {id:4,nameEn:'Moisture Cream SPF50',nameKh:'\u1780\u17D2\u179A\u17C2\u1798 SPF50',brand:'INNISFREE',category:'skincare',price:35,sale:28,badge:'sale',emoji:'\u2600\uFE0F',stock:60,imgs:['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop']},
  {id:5,nameEn:'Brow Pencil Duo',nameKh:'\u1781\u17D2\u1798\u17C5\u178A\u17C3\u1785\u17B7\u1789\u17D2\u1785\u17BE\u1798',brand:'ETUDE',category:'makeup',price:22,sale:null,badge:'new',emoji:'\u270F\uFE0F',stock:30,imgs:['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80&fit=crop']},
  {id:6,nameEn:'Argan Hair Mask',nameKh:'\u1798\u17C9\u17B6\u179F\u17D2\u1780\u179A\u179F\u1780\u17CB\u17A2\u17B6\u179A\u17A0\u17D2\u1782\u17B6\u1793',brand:'MOROCCAN OIL',category:'hair',price:55,sale:null,badge:'bestseller',emoji:'\u{1F486}',stock:20,imgs:['https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80&fit=crop']},
  {id:7,nameEn:'Hydra-Boost Foundation',nameKh:'\u1798\u17BC\u179B\u178A\u17D2\u178B\u17B6\u1793\u1787\u17C6\u1793\u17C7',brand:'FENTY',category:'makeup',price:42,sale:null,badge:'new',emoji:'\u2728',stock:35,imgs:['https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&q=80&fit=crop']},
  {id:8,nameEn:'Vitamin C Brightening Toner',nameKh:'\u1790\u17BC\u1793\u17D0\u179A\u17A2\u17C6\u1794\u17C4\u17C7 C',brand:'SOME BY MI',category:'skincare',price:29,sale:22,badge:'sale',emoji:'\u{1F34A}',stock:50,imgs:['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80&fit=crop']},
];

const promos = [
  '<strong>FREE DELIVERY</strong> on orders over $30 &nbsp;&middot;&nbsp; \u178A\u17B9\u1780\u1787\u1789\u17D2\u1787\u17BC\u1793<strong>\u17A5\u178F\u1782\u17B7\u178F\u1790\u17D2\u179B\u17C3</strong>',
  '\u2726 New arrivals just dropped! Use code <strong>THIDA10</strong> for 10% off',
  '\u{1F381} Refer a friend, earn <strong>$8 credit</strong> &mdash; Share your code now!',
  '\u{1F48E} Diamond members: exclusive 15% off this weekend only',
];

export default function HomePage() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // App state
  const [lang, setLangState] = useState<'en' | 'kh'>('en');
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);
  const [promoIdx, setPromoIdx] = useState(0);
  const [timer, setTimer] = useState({ h: '06', m: '24', s: '00' });
  const [liveCount, setLiveCount] = useState(247);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState('#C9A96E');
  const [toastVisible, setToastVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const timerEnd = useRef(new Date(Date.now() + 6 * 3600000 + 24 * 60000));
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auth: check user on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from('profiles').select('is_admin').eq('id', user.id).single()
          .then(({ data }) => {
            if (data?.is_admin) setIsAdmin(true);
          });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Countdown timer
  useEffect(() => {
    const iv = setInterval(() => {
      const diff = timerEnd.current.getTime() - Date.now();
      if (diff <= 0) { clearInterval(iv); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimer({ h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Live count
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveCount(prev => Math.max(180, Math.min(400, prev + Math.floor(Math.random() * 5) - 2)));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  // Promo rotation
  useEffect(() => {
    const iv = setInterval(() => {
      setPromoIdx(prev => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  // Scroll to top listener
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Hero carousel
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Helpers
  const showToast = useCallback((msg: string, color = '#C9A96E') => {
    setToastMsg(msg);
    setToastColor(color);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  }, []);

  const getFiltered = useCallback(() => {
    return products.filter(p => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (activeFilter === 'new' && p.badge !== 'new') return false;
      if (activeFilter === 'sale' && !p.sale) return false;
      if (activeFilter === 'bestseller' && p.badge !== 'bestseller') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.nameEn.toLowerCase().includes(q) && !p.nameKh.includes(q) && !p.brand.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, activeCategory, activeFilter, searchQuery]);

  const addToCart = useCallback((id: number) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    setCart(prev => {
      const ex = prev.find(c => c.id === id);
      if (ex) return prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1 }];
    });
    showToast(`${lang === 'en' ? 'Added' : '\u1794\u17B6\u1793\u178A\u17B6\u1780\u17CB'}: ${lang === 'en' ? p.nameEn : p.nameKh}`, '#C9A96E');
  }, [products, lang, showToast]);

  const changeQty = useCallback((id: number, d: number) => {
    setCart(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, qty: c.qty + d } : c);
      return updated.filter(c => c.qty > 0);
    });
  }, []);

  const cartTotal = cart.reduce((s, c) => s + ((c.sale || c.price) * c.qty), 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const filtered = getFiltered();
  const freeShipThreshold = 30;
  const shipPct = Math.min(100, (cartTotal / freeShipThreshold) * 100);
  const shipRemaining = Math.max(0, freeShipThreshold - cartTotal);

  const setLang = (l: 'en' | 'kh') => {
    setLangState(l);
  };

  // The t() helper for bilingual text
  const t = (en: string, kh: string) => lang === 'en' ? en : kh;

  // Suppress unused variable warnings
  void liveCount;

  return (
    <>
      {/* PROMO BANNER */}
      {promoVisible && (
        <div className="promo-banner">
          <div className="promo-slides">
            <span className="promo-dot" />
            <span dangerouslySetInnerHTML={{ __html: promos[promoIdx] }} />
            <span className="promo-dot" />
          </div>
          <button className="promo-close" onClick={() => setPromoVisible(false)}>&#x2715;</button>
        </div>
      )}

      {/* LANG BAR */}
      <div className="lang-bar">
        <div className="lang-bar-left">
          <span>{'\u{1F4CD}'} Phnom Penh, Cambodia</span>
          <a href="#">{t('Track Order', '\u178F\u17B6\u1798\u178A\u17B6\u1793\u1780\u17B6\u179A\u1794\u1789\u17D2\u1787\u17B6\u1791\u17B7\u1789')}</a>
          <a href="#">{t('Help', '\u1787\u17C6\u1793\u17BD\u1799')}</a>
        </div>
        <div className="lang-bar-right">
          <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          <button className={`lang-btn ${lang === 'kh' ? 'active' : ''}`} onClick={() => setLang('kh')}>{'\u1781\u17D2\u1798\u17C2\u179A'}</button>
        </div>
      </div>

      {/* HEADER */}
      <header>
        <div className="header-inner">
          <Link className="logo" href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <span className="logo-main">ThidaBeauty</span>
            <span className="logo-khmer">{'\u1790\u17B8\u178F\u17B6\u1794\u17D2\u1799\u17BC\u1791\u17B8'}</span>
          </Link>
          <nav>
            <a href="#" className="has-badge">{t('New Arrivals', '\u1798\u1780\u1790\u17D2\u1798\u17B8')}</a>
            <a href="#">{t('Skincare', '\u1790\u17C2\u1791\u17B6\u17C6\u179F\u17D2\u1794\u17C2\u1780')}</a>
            <a href="#">{t('Makeup', '\u1782\u17D2\u179A\u17BF\u1784\u178F\u17BB\u1794\u178F\u17C2\u1784')}</a>
            <a href="#">{t('Fragrance', '\u17A2\u1794\u17CB')}</a>
            <a href="#">{t('Brands', '\u1798\u17C9\u17B6\u1780')}</a>
            <a href="#" style={{ color: 'var(--rose)' }}>{t('Sale', '\u179B\u1780\u17CB')}</a>
          </nav>
          <div className="header-actions">
            {user ? (
              <div className="header-auth-links">
                {isAdmin && <Link href="/admin">Admin</Link>}
                <Link href="/account">{user.email?.split('@')[0]}</Link>
              </div>
            ) : (
              <div className="header-auth-links">
                <Link href="/login">{t('Login', '\u1785\u17BC\u179B')}</Link>
                <Link href="/signup">{t('Sign Up', '\u1785\u17BB\u17C7\u1788\u17D2\u1798\u17C4\u17C7')}</Link>
              </div>
            )}
            <button className="icon-btn" onClick={() => { setSearchOpen(!searchOpen); }}>{'\u{1F50D}'}</button>
            <button className="icon-btn" title="Wishlist">{'\u{1F90D}'}</button>
            <button className="icon-btn" onClick={() => setCartOpen(true)}>
              {'\u{1F6D2}'}<span className="cart-badge">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className={`search-bar ${searchOpen ? 'open' : ''}`}>
        <div className="search-wrap">
          <span className="search-icon-pos">{'\u{1F50D}'}</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('Search products\u2026', '\u179F\u17D2\u179C\u17C2\u1784\u179A\u1780\u1795\u179B\u17B7\u178F\u1795\u179B\u2026')}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSuggestionsOpen(false); }}
            onFocus={() => { if (!searchQuery) setSuggestionsOpen(true); }}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 200)}
          />
          <div className={`search-suggestions ${suggestionsOpen ? 'show' : ''}`}>
            {[
              { emoji: '\u{1F33F}', label: 'Serum', cat: 'skincare' },
              { emoji: '\u{1F484}', label: 'Lip Tint', cat: 'makeup' },
              { emoji: '\u{1F338}', label: 'Rose Perfume', cat: 'fragrance' },
              { emoji: '\u2600\uFE0F', label: 'SPF Moisturizer', cat: 'skincare' },
            ].map(s => (
              <div key={s.label} className="search-sugg-item" onClick={() => { setSearchQuery(s.label); setSuggestionsOpen(false); }}>
                {s.emoji} {s.label} <span>{s.cat}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="lang-btn" onClick={() => setSearchOpen(false)}>&#x2715;</button>
      </div>

      {/* SOCIAL PROOF TICKER */}
      <div className="social-proof-ticker">
        <div className="ticker-track">
          {[
            { avatar: '\u{1F338}', text: <><strong>Sreymom</strong> just bought <span className="prod">Glow Serum</span></> },
            { avatar: '\u{1F484}', text: <><strong>Dara</strong> purchased <span className="prod">Velvet Lip Tint</span></> },
            { avatar: '\u2728', text: <><strong>Channary</strong> left a 5&#x2605; review</> },
            { avatar: '\u{1F6D2}', text: <><strong>Bopha</strong> just added <span className="prod">Rose Mist Perfume</span> to cart</> },
            { avatar: '\u{1F381}', text: <><strong>Kosal</strong> used referral code &mdash; saved $8</> },
            { avatar: '\u{1F33F}', text: <><strong>Lida</strong> purchased <span className="prod">Argan Hair Mask</span></> },
            { avatar: '\u{1F486}', text: <><strong>Sophea</strong> earned <span className="prod">Gold Status</span> today</> },
          ].map((item, i) => (
            <div key={`t-${i}`} className="ticker-item"><div className="avatar">{item.avatar}</div><span>{item.text}</span></div>
          ))}
        </div>
      </div>

      {/* HERO CAROUSEL */}
      <section id="hero-section" style={{ padding: 0, position: 'relative', overflow: 'hidden', background: '#fff0f2', width: '100%' }}>
        <div style={{ position: 'relative', width: '100%', transition: 'opacity 0.8s ease', opacity: currentSlide === 0 ? 1 : 0, lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1800&q=80&fit=crop" alt="Beauty Hero 1" style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'cover' }} />
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transition: 'opacity 0.8s ease', opacity: currentSlide === 1 ? 1 : 0, lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1800&q=80&fit=crop" alt="Beauty Hero 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 20 }}>
          {[0, 1].map(i => (
            <button key={i} onClick={() => setCurrentSlide(i)} style={{ width: currentSlide === i ? 28 : 10, height: 3, background: currentSlide === i ? 'var(--gold)' : 'rgba(201,169,110,0.35)', border: 'none', cursor: 'pointer', borderRadius: 2, transition: 'all .3s', padding: 0 }} />
          ))}
        </div>
      </section>

      {/* CATS STRIP */}
      <div className="cats-strip">
        {[
          { icon: '\u2726', en: 'All', kh: '\u1791\u17B6\u17C6\u1784\u17A2\u179F\u17CB', cat: 'all' },
          { icon: '\u{1F33F}', en: 'Skincare', kh: '\u1790\u17C2\u179F\u17D2\u1794\u17C2\u1780', cat: 'skincare' },
          { icon: '\u{1F484}', en: 'Makeup', kh: '\u178F\u17BB\u1794\u178F\u17C2\u1784', cat: 'makeup' },
          { icon: '\u{1F338}', en: 'Fragrance', kh: '\u17A2\u1794\u17CB', cat: 'fragrance' },
          { icon: '\u{1F486}', en: 'Hair', kh: '\u179F\u1780\u17CB', cat: 'hair' },
          { icon: '\u{1F9F4}', en: 'Body', kh: '\u1781\u17D2\u179B\u17BD\u1793', cat: 'body' },
        ].map(c => (
          <button key={c.cat} className="cat-chip" onClick={() => setActiveCategory(c.cat)}>
            <span className="cat-icon">{c.icon}</span>
            <span className="cat-label">{t(c.en, c.kh)}</span>
          </button>
        ))}
      </div>

      {/* FEATURES */}
      <div className="features-strip">
        <div className="features-inner">
          {[
            { icon: '\u{1F69A}', title: [t('Free Delivery', '\u178A\u17B9\u1780\u1787\u1789\u17D2\u1787\u17BC\u1793\u17A5\u178F\u1782\u17B7\u178F\u1790\u17D2\u179B\u17C3')], sub: t('Orders over $30', '\u179B\u17BE\u1780\u17B6\u179A\u1794\u1789\u17D2\u1787\u17B6\u1791\u17B7\u1789\u1787\u17B6\u1784 $30') },
            { icon: '\u2713', title: [t('100% Authentic', '\u1794\u17D2\u179A\u1780\u1794\u178A\u17C4\u1799\u1797\u17B6\u1796\u1796\u17B7\u178F')], sub: t('Certified genuine', '\u1795\u179B\u17B7\u178F\u1795\u179B\u1796\u17B7\u178F\u1794\u17D2\u179A\u17B6\u1780\u178A') },
            { icon: '\u21A9', title: [t('Easy Returns', '\u178F\u17D2\u179A\u17A1\u1794\u17CB\u1784\u17B6\u1799')], sub: t('14-day policy', '\u1782\u17C4\u179B\u1780\u17B6\u179A\u178E\u17CD 14 \u1790\u17D2\u1784\u17C3') },
            { icon: '\u2B50', title: [t('Earn Points', '\u1794\u17D2\u179A\u1798\u17BC\u179B\u1796\u17B7\u1793\u17D2\u1791\u17BB')], sub: t('Rewards on every order', '\u179A\u1784\u17D2\u179C\u17B6\u1793\u17CB\u179B\u17BE\u1780\u17B6\u179A\u1794\u1789\u17D2\u1787\u17B6\u1791\u17B7\u1789') },
          ].map((f, i) => (
            <div key={i} className="feature-item">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-text">
                <strong>{f.title[0]}</strong>
                <span>{f.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COUNTDOWN TIMER - hidden */}

      {/* PRODUCTS */}
      <section id="products-section" style={{ background: '#FFF6F7' }}>
        <div className="section-header">
          <div>
            <div className="section-title">{t('Featured Products', '\u1795\u179B\u17B7\u178F\u1795\u179B\u1796\u17B7\u179F\u17C1\u179F')}</div>
            <div className="section-title-kh">{'\u1795\u179B\u17B7\u178F\u1795\u179B\u1796\u17B7\u179F\u17C1\u179F'}</div>
          </div>
          <button className="view-all">{t('View All', '\u1798\u17BE\u179B\u1791\u17B6\u17C6\u1784\u17A2\u179F\u17CB')}</button>
        </div>
        <div className="filter-bar">
          {[
            { label: t('All', '\u1791\u17B6\u17C6\u1784\u17A2\u179F\u17CB'), filter: 'all' },
            { label: t('New', '\u1798\u1780\u1790\u17D2\u1798\u17B8'), filter: 'new' },
            { label: t('On Sale', '\u179B\u1780\u17CB'), filter: 'sale' },
            { label: t('Best Sellers', '\u179B\u1780\u17CB\u178A\u17B6\u1785\u17CB'), filter: 'bestseller' },
          ].map(f => (
            <button key={f.filter} className={`filter-chip ${activeFilter === f.filter ? 'active' : ''}`} onClick={() => setActiveFilter(f.filter)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="products-grid">
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              {t('No products found', '\u179A\u1780\u1798\u17B7\u1793\u1783\u17BE\u1789')}
            </div>
          ) : filtered.map(p => {
            const name = lang === 'en' ? p.nameEn : p.nameKh;
            const sub = lang === 'en' ? p.nameKh : p.nameEn;
            const views = 20 + Math.floor(p.id * 37 % 180);
            return (
              <div key={p.id} className="product-card">
                <div className="product-img">
                  {p.imgs.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imgs[0]} alt={name} />
                  ) : (
                    <div className="product-img-placeholder">{p.emoji}</div>
                  )}
                  {p.badge && (
                    <span className={`product-badge ${p.badge === 'new' ? 'new' : p.badge === 'bestseller' ? 'bestseller' : ''}`}>
                      {p.badge === 'new' ? t('NEW', '\u1790\u17D2\u1798\u17B8') : p.badge === 'sale' ? t('SALE', '\u179B\u1780\u17CB') : t('BEST', '\u179B\u17D2\u17A2')}
                    </span>
                  )}
                  {p.stock <= 5 && <div className="stock-urgency low">{'\u26A0'} Only {p.stock} left!</div>}
                  <div className="product-actions">
                    <button className="quick-btn cart" onClick={() => addToCart(p.id)}>
                      {t('Add to Cart', '\u1794\u1793\u17D2\u1790\u17C2\u1798')}
                    </button>
                    <button className="quick-btn wish">{'\u{1F90D}'}</button>
                  </div>
                </div>
                <div className="product-info">
                  <div className="product-brand">{p.brand}</div>
                  <div className="product-name">{name}</div>
                  <div className="product-name-kh">{sub}</div>
                  <div className="product-price-row">
                    <div className="product-price">
                      {p.sale ? (
                        <><span className="original">${p.price.toFixed(2)}</span><span className="sale">${p.sale.toFixed(2)}</span></>
                      ) : `$${p.price.toFixed(2)}`}
                    </div>
                    <div className="stars">{'\u2605\u2605\u2605\u2605\u2605'}</div>
                  </div>
                  <div className="view-count">{'\u{1F441}'} {views} {t('viewed today', '\u1794\u17B6\u1793\u1798\u17BE\u179B\u1790\u17D2\u1784\u17C3\u1793\u17C1\u17C7')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SALE BANNER - hidden */}

      {/* EDITORIAL FEATURE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 480 }}>
        {[
          { img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=900&q=80&fit=crop', tag: 'New Collection', title: 'Skincare', em: 'Essentials', cat: 'skincare' },
          { img: 'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=900&q=80&fit=crop', tag: 'Trending Now', title: 'Makeup', em: 'Must-Haves', cat: 'makeup' },
        ].map((b, i) => (
          <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.img} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(26,18,8,0.7) 0%,transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 40 }}>
              <span style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>{b.tag}</span>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: 'white', fontWeight: 300, marginBottom: 12 }}>{b.title}<br /><em style={{ color: 'var(--gold)' }}>{b.em}</em></h3>
              <button className="btn-gold" style={{ width: 'fit-content', fontSize: 10 }} onClick={() => { setActiveCategory(b.cat); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
                Shop {b.title} {'\u2192'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* REVIEWS */}
      <div className="reviews-section">
        <div className="section-header" style={{ maxWidth: 1400, margin: '0 auto 32px' }}>
          <div>
            <div className="section-title">{t('What Customers Say', '\u17A2\u17D2\u179C\u17B8\u178A\u17C2\u179B\u17A2\u178F\u17B7\u1790\u17B7\u1787\u1793\u1793\u17B7\u1799\u17B6\u1799')}</div>
            <div className="section-title-kh">{'\u17A2\u17D2\u179C\u17B8\u178A\u17C2\u179B\u17A2\u178F\u17B7\u1790\u17B7\u1787\u1793\u1793\u17B7\u1799\u17B6\u1799'}</div>
          </div>
        </div>
        <div className="review-summary">
          <div className="overall-score">
            <div className="score-big">4.9</div>
            <div className="score-stars">{'\u2605\u2605\u2605\u2605\u2605'}</div>
            <div className="score-count">2,847 reviews</div>
          </div>
          <div className="rating-bars">
            {[91, 6, 2, 1, 0].map((pct, i) => (
              <div key={i} className="rating-row">
                <span>{5 - i} {'\u2605'}</span>
                <div className="rating-bar-wrap"><div className="rating-bar-fill" style={{ width: `${pct}%` }} /></div>
                <span className="rating-count">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="reviews-grid">
          {[
            { text: '"The Glow Serum transformed my skin in just 2 weeks. Genuinely the best purchase I\'ve made this year!"', avatar: '\u{1F338}', name: 'Sreymom K.', date: 'Feb 2025' },
            { text: '"Fast delivery to Phnom Penh, authentic products. I\'ll never buy beauty products anywhere else. \u2764\uFE0F"', avatar: '\u{1F484}', name: 'Channary R.', date: 'Jan 2025' },
            { text: '"The loyalty points system is amazing \u2014 I got a free product after my 3rd order. Highly recommend!"', avatar: '\u2728', name: 'Bopha S.', date: 'Mar 2025' },
          ].map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-stars">{'\u2605\u2605\u2605\u2605\u2605'}</div>
              <div className="review-text">{r.text}</div>
              <div className="review-author">
                <div className="review-avatar">{r.avatar}</div>
                <div><div className="review-name">{r.name}</div><div className="review-date">{r.date}</div></div>
                <div className="review-verified">{'\u2713'} Verified</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INSTAGRAM FEED */}
      <div className="insta-section">
        <div className="insta-header">
          <div>
            <div className="section-title">{t('Shop Our Feed', '\u1791\u17B7\u1789\u1796\u17B8 Feed \u179A\u1794\u179F\u17CB\u1799\u17BE\u1784')}</div>
            <div className="section-title-kh">{'\u1791\u17B7\u1789\u1796\u17B8 Feed \u179A\u1794\u179F\u17CB\u1799\u17BE\u1784'}</div>
          </div>
          <a href="#" style={{ fontSize: 14, color: 'var(--gold)', textDecoration: 'none', letterSpacing: 2 }}>@thidabeauty.kh {'\u2197'}</a>
        </div>
        <div className="insta-grid">
          {[
            'photo-1487412912498-0447578fcca8',
            'photo-1512496015851-a90fb38ba796',
            'photo-1571781926291-c477ebfd024b',
            'photo-1522337360788-8b13dee7a37e',
            'photo-1556228578-8c89e6adf883',
            'photo-1599305445671-ac291c95aaa9',
          ].map((id, i) => (
            <div key={i} className="insta-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://images.unsplash.com/${id}?w=400&q=80&fit=crop`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="beauty" />
              <div className="insta-overlay"><span className="icon">{'\u{1F6CD}\uFE0F'}</span><span>Shop Now</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* LOYALTY PROGRAM */}
      <div className="loyalty-section" id="loyalty-anchor">
        <div className="loyalty-inner">
          <div className="loyalty-left">
            <span className="tag">{t('\u2726 Thida Rewards', '\u2726 \u179A\u1784\u17D2\u179C\u17B6\u1793\u17CB\u1790\u17B8\u178F\u17B6')}</span>
            <h2>{t('Beauty That Rewards You', '\u179F\u1798\u17D2\u179A\u179F\u17CB\u178A\u17C2\u179B\u1795\u17D2\u178F\u179B\u17CB\u179A\u1784\u17D2\u179C\u17B6\u1793\u17CB')}</h2>
            <p className="kh">{'\u179F\u1798\u17D2\u179A\u179F\u17CB\u178A\u17C2\u179B\u1795\u17D2\u178F\u179B\u17CB\u179A\u1784\u17D2\u179C\u17B6\u1793\u17CB'}</p>
            <p>{t('Earn points on every purchase, unlock exclusive perks & rise through our loyalty tiers.', '\u1794\u17D2\u179A\u1798\u17BC\u179B\u1796\u17B7\u1793\u17D2\u1791\u17BB\u179A\u17C0\u1784\u179A\u17B6\u179B\u17CB\u1780\u17B6\u179A\u1791\u17B7\u1789 \u178A\u17C4\u17C7\u179F\u17C4\u17A2\u178F\u17D2\u1790\u1794\u17D2\u179A\u1799\u17C4\u1787\u1793\u17CD & \u1785\u17BC\u179B\u178A\u17C6\u178E\u17B6\u1780\u17CB\u1780\u17B6\u179B\u1781\u17D2\u1796\u179F\u17CB')}</p>
            <div className="tier-cards">
              <div className="tier-card"><div className="tier-icon">{'\u{1F33F}'}</div><div className="tier-name">Silver</div><div className="tier-pts">0&ndash;499 pts</div><div className="tier-benefits">5% back<br />Free shipping</div></div>
              <div className="tier-card active-tier"><div className="tier-icon">{'\u2726'}</div><div className="tier-name">Gold</div><div className="tier-pts">500&ndash;1999 pts</div><div className="tier-benefits">10% back<br />Early access<br />Birthday gift</div></div>
              <div className="tier-card"><div className="tier-icon">{'\u{1F48E}'}</div><div className="tier-name">Diamond</div><div className="tier-pts">2000+ pts</div><div className="tier-benefits">15% back<br />VIP events<br />Free samples</div></div>
            </div>
          </div>
          <div>
            <div className="loyalty-progress-box">
              <div className="lp-header">
                <div><div className="pts-big">120</div><div className="pts-label">{t('Your Points', '\u1796\u17B7\u1793\u17D2\u1791\u17BB\u179A\u1794\u179F\u17CB\u17A2\u17D2\u1793\u1780')}</div></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'rgba(201,169,110,.5)', letterSpacing: 1 }}>{t('GOLD MEMBER', '\u179F\u1798\u17B6\u1787\u17B7\u1780\u1798\u17B6\u179F')}</div>
                  <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 4 }}>{'\u2726'} Active</div>
                </div>
              </div>
              <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: '6%' }} /></div>
              <div className="progress-label"><span>120 pts</span><span>2000 for Diamond {'\u{1F48E}'}</span></div>
              <div className="lp-perks">
                {[
                  { checked: true, text: t('10% cashback on every order', '10% \u179F\u17C6\u178E\u1784\u17CB\u179B\u17BE\u1780\u17B6\u179A\u1794\u1789\u17D2\u1787\u17B6\u1791\u17B7\u1789') },
                  { checked: true, text: t('Free shipping on all orders', '\u178A\u17B9\u1780\u1787\u1789\u17D2\u1787\u17BC\u1793\u17A5\u178F\u1782\u17B7\u178F\u1790\u17D2\u179B\u17C3') },
                  { checked: true, text: t('Birthday surprise gift', '\u17A2\u17C6\u178E\u17C4\u1799\u1790\u17D2\u1784\u17C3\u1781\u17BD\u1794\u1780\u17C6\u178E\u17BE\u178F') },
                  { checked: false, text: t('VIP events & previews (Diamond)', '\u1796\u17D2\u179A\u17B9\u178F\u17D2\u178F\u17B7\u1780\u17B6\u179A\u178E\u17CD VIP (Diamond)') },
                ].map((p, i) => (
                  <div key={i} className="lp-perk">
                    <div className="ck" style={!p.checked ? { background: 'rgba(201,169,110,.05)', borderColor: 'rgba(201,169,110,.2)', color: 'var(--muted)' } : {}}>
                      {p.checked ? '\u2713' : '\u25CB'}
                    </div>
                    <span style={!p.checked ? { color: 'rgba(255,255,255,.3)' } : {}}>{p.text}</span>
                  </div>
                ))}
              </div>
              <button className="earn-btn" onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('Earn More Points \u2192', '\u1794\u17D2\u179A\u1798\u17BC\u179B\u1796\u17B7\u1793\u17D2\u1791\u17BB\u1794\u1793\u17D2\u1790\u17C2\u1798 \u2192')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REFERRAL - hidden */}

      {/* FRAGRANCE BANNER - hidden */}

      {/* EMAIL SIGNUP */}
      <div className="email-section">
        <span className="tag">{t('\u2709 Beauty Insider', '\u2709 \u17A2\u17D2\u1793\u1780\u179F\u17D2\u1782\u17B6\u179B\u17CB\u179F\u1798\u17D2\u179A\u179F\u17CB')}</span>
        <h2>{t('First to Know. First to Glow.', '\u178A\u17B9\u1784\u1798\u17BB\u1793\u17D4 \u1797\u17D2\u179B\u17BA\u1785\u17B6\u17C6\u1784\u1798\u17BB\u1793')}</h2>
        <p className="kh" style={{ color: 'rgba(201,169,110,.45)', fontSize: 15, marginBottom: 12 }}>{'\u178A\u17B9\u1784\u1798\u17BB\u1793\u17D4 \u1797\u17D2\u179B\u17BA\u1785\u17B6\u17C6\u1784\u1798\u17BB\u1793'}</p>
        <p>{t('Join 18,000+ beauty lovers. Get exclusive deals, new arrivals & beauty tips delivered to your inbox.', '\u1785\u17BC\u179B\u179A\u17BD\u1798\u1787\u17B6\u1798\u17BD\u1799\u17A2\u17D2\u1793\u1780\u179F\u17D2\u179A\u17A1\u17B6\u1789\u17CB\u179F\u1798\u17D2\u179A\u179F\u17CB 18,000+')}</p>
        <div className="email-form">
          <input type="email" placeholder={t('your@email.com', '\u17A2\u17CA\u17B8\u1798\u17C2\u179B\u179A\u1794\u179F\u17CB\u17A2\u17D2\u1793\u1780\u2026')} />
          <button onClick={() => showToast('\u{1F389} Welcome! Code THIDA10 sent to your inbox.', '#4CAF7D')}>{t('Subscribe', '\u1787\u17B6\u179C')}</button>
        </div>
        <div className="email-perks">
          {[t('10% off first order', '10% \u1785\u17C6\u178E\u17C5\u1780\u17B6\u179A\u1794\u1789\u17D2\u1787\u17B6\u1791\u17B7\u1789\u178A\u17C6\u1794\u17BC\u1784'), t('Early sale access', '\u1785\u17BC\u179B\u179B\u1780\u17CB \u1798\u17BB\u1793\u1793\u178E\u17B6'), t('Beauty tips weekly', '\u1782\u1793\u17D2\u179B\u17B9\u17C7\u179F\u1798\u17D2\u179A\u179F\u17CB\u1794\u17D2\u179A\u1785\u17B6\u17C6\u179F\u1794\u17D2\u178F\u17B6\u17A0\u17CD'), t('Unsubscribe anytime', '\u179B\u17C2\u1784\u1787\u17B6\u179C\u1796\u17C1\u179B\u178E\u17B6\u1780\u17CF\u1794\u17B6\u1793')].map((p, i) => (
            <span key={i} className="email-perk">{p}</span>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          {/* footer-brand hidden */}
          <div className="footer-col">
            <h4>{t('Shop', '\u17A0\u17B6\u1784')}</h4>
            <ul>
              {[t('New Arrivals', '\u1798\u1780\u1790\u17D2\u1798\u17B8'), t('Best Sellers', '\u179B\u1780\u17CB\u178A\u17B6\u1785\u17CB'), t('Flash Sale', 'Flash Sale'), t('All Brands', '\u1798\u17C9\u17B6\u1780\u1791\u17B6\u17C6\u1784\u17A2\u179F\u17CB'), t('Gift Sets', '\u17A2\u17C6\u178E\u17C4\u1799\u17A2\u17C6\u178E\u17C4\u1799')].map(item => (
                <li key={item}><a href="#">{item}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('Earn & Save', '\u179A\u1780\u1794\u17D2\u179A\u17B6\u1780\u17CB & \u179F\u1793\u17D2\u179F\u17C6')}</h4>
            <ul>
              {[t('Loyalty Program', '\u1780\u1798\u17D2\u1798\u179C\u17B7\u1792\u17B8\u1797\u1780\u17D2\u178F\u17B8\u1797\u17B6\u1796'), t('Refer a Friend', '\u178E\u17C2\u1793\u17B6\u17C6\u1798\u17B7\u178F\u17D2\u178F'), t('Affiliate Program', '\u1780\u1798\u17D2\u1798\u179C\u17B7\u1792\u17B8 Affiliate'), t('Promo Codes', '\u179B\u17C1\u1781\u1780\u17BC\u178A\u1794\u17D2\u179A\u17BC\u1798\u17C9\u17BC')].map(item => (
                <li key={item}><a href="#">{item}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('Help', '\u1787\u17C6\u1793\u17BD\u1799')}</h4>
            <ul>
              {[t('Track Order', '\u178F\u17B6\u1798\u178A\u17B6\u1793'), t('Returns', '\u178F\u17D2\u179A\u17A1\u1794\u17CB & \u1794\u17D2\u178A\u17BC\u179A'), 'FAQ', t('Contact Us', '\u1791\u17C6\u1793\u17B6\u1780\u17CB\u1791\u17C6\u1793\u1784')].map(item => (
                <li key={item}><a href="#">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 ThidaBeauty &middot; {'\u1790\u17B8\u178F\u17B6\u1794\u17D2\u1799\u17BC\u1791\u17B8'} &middot; Phnom Penh, Cambodia</p>
          <div className="socials">
            <a href="#" title="Facebook">{'\u{1F4D8}'}</a>
            <a href="#" title="Instagram">{'\u{1F4F7}'}</a>
            <a href="#" title="TikTok">{'\u{1F3B5}'}</a>
            <a href="#" title="Telegram">{'\u2708\uFE0F'}</a>
          </div>
        </div>
      </footer>

      {/* CART DRAWER */}
      <div className={`modal-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>{t('Your Cart', '\u1780\u1793\u17D2\u178F\u17D2\u179A\u1780\u179A\u1794\u179F\u17CB\u17A2\u17D2\u1793\u1780')}</h3>
          <button className="close-cart" onClick={() => setCartOpen(false)}>&#x2715;</button>
        </div>
        <div className="cart-shipping-progress">
          <div className="csp-text">
            <span>{t('Add', '\u1794\u1793\u17D2\u1790\u17C2\u1798')}&nbsp;<strong>{shipRemaining > 0 ? `$${shipRemaining.toFixed(2)}` : t('You got it!', '\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793\u17A0\u17BE\u1799!')}</strong>&nbsp;{t('more for FREE shipping', '\u1791\u17C0\u178F\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1780\u17B6\u179A\u178A\u17B9\u1780\u1787\u1789\u17D2\u1787\u17BC\u1793 FREE')}</span>
          </div>
          <div className="csp-bar-wrap"><div className="csp-bar-fill" style={{ width: `${shipPct}%` }} /></div>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="icon">{'\u{1F6D2}'}</div>
              <p>{t('Your cart is empty', '\u1780\u1793\u17D2\u178F\u17D2\u179A\u1780\u179A\u1794\u179F\u17CB\u17A2\u17D2\u1793\u1780\u1791\u1791\u17C1')}</p>
            </div>
          ) : cart.map(c => {
            const name = lang === 'en' ? c.nameEn : c.nameKh;
            const price = c.sale || c.price;
            return (
              <div key={c.id} className="cart-item">
                <div className="cart-thumb">
                  {c.imgs.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imgs[0]} alt={name} />
                  ) : c.emoji}
                </div>
                <div className="cart-item-info">
                  <div className="brand">{c.brand}</div>
                  <div className="name">{name}</div>
                  <div className="product-price">${price.toFixed(2)}</div>
                  <div className="cart-qty">
                    <button className="qty-btn" onClick={() => changeQty(c.id, -1)}>{'\u2212'}</button>
                    <span>{c.qty}</span>
                    <button className="qty-btn" onClick={() => changeQty(c.id, 1)}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cart-footer">
          <div className="cart-total">
            <span>{t('Total', '\u179F\u179A\u17BB\u1794')}</span>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>
          <button className="checkout-btn">{t('Checkout \u2192', '\u1791\u17BC\u1791\u17B6\u178F\u17CB \u2192')}</button>
        </div>
      </div>


      {/* ADD PRODUCT FLOAT (admin only) */}
      {isAdmin && (
        <Link href="/admin" className="add-product-float" title="Add Product">+</Link>
      )}

      {/* SCROLL TO TOP */}
      <button className={`scroll-top ${showScrollTop ? 'show' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{'\u2191'}</button>

      {/* TOAST */}
      <div className={`success-toast ${toastVisible ? 'show' : ''}`} style={{ borderColor: toastColor }}>
        <span>{'\u2713'}</span><span>{toastMsg}</span>
      </div>
    </>
  );
}
