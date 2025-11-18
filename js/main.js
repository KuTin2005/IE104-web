/* ======= Main behaviors: header, nav, preview, pagination, harvest... ======= */
(() => {
  const $  = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  /* [1] Header shadow on scroll */
  const header = $('.header');
  header && addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });

  /* [2] Mobile menu toggle */
  const navToggle = $('.nav-toggle'), menu = $('.menu');
  navToggle?.addEventListener('click', () => {
    const ex = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', !ex);
    menu?.classList.toggle('open');
  });

  /* [3] Dropdown for mobile */
  $$('.has-dropdown > a').forEach(a => a.addEventListener('click', e => {
    if (matchMedia('(max-width:992px)').matches) {
      e.preventDefault();
      a.parentElement.classList.toggle('open');
    }
  }));

  /* [4] Search form redirect → list.html?q=... */
  $('form.search')?.addEventListener('submit', e => {
    e.preventDefault();
    const q = e.target.querySelector('input[type="search"]').value.trim();
    location.href = q ? `list.html?q=${encodeURIComponent(q)}` : 'list.html';
  });

  /* [5] Block hash-only links (#) */
  document.addEventListener('click', e => e.target.closest('a[href^="#"]') && e.preventDefault());

  /* ===================== [6] VIDEO PREVIEW ===================== */
  const Preview = (() => {
    const pop = Object.assign(document.createElement('div'), { className: 'preview-pop' });
    const vid = Object.assign(document.createElement('video'), { muted:true, loop:true, playsInline:true, preload:'none' });
    pop.appendChild(vid); document.body.appendChild(pop);

    // Arrow CSS
    const css = `.preview-pop::after{content:"";position:absolute;top:var(--y,50%);transform:translateY(-50%);border:10px solid transparent}
      .preview-pop[data-side="right"]::after{left:-20px;border-right-color:#000}
      .preview-pop[data-side="left"]::after{right:-20px;border-left-color:#000}`;
    document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

    const GAP=14, W=420, H=W*9/16; let cur=null, hideTm=0;

    const place = el => {
      const r = el.getBoundingClientRect(), vw=innerWidth, vh=innerHeight;
      const right = r.right + GAP + W <= vw;
      const left = right ? r.right + GAP : Math.max(GAP, r.left - GAP - W);
      const cy = r.top + r.height/2, top = Math.min(vh - GAP - H, Math.max(GAP, cy - H/2));
      Object.assign(pop.style, { left: left+scrollX+'px', top: top+scrollY+'px' });
      pop.dataset.side = right ? 'right' : 'left';
      pop.style.setProperty('--y', (cy - top) + 'px');
    };

    const show = el => {
      clearTimeout(hideTm);
      const src = el.dataset.video; if (!src) return;
      const abs = new URL(src, location.href).href;
      if (vid.src !== abs){ vid.src = abs; vid.currentTime = 0; }
      place(el); pop.classList.add('show'); vid.play().catch(()=>{});
      cur = el;
    };

    const hide = () => hideTm = setTimeout(() => { pop.classList.remove('show'); vid.pause(); cur=null; }, 80);

    const bound = new WeakSet();
    const attach = (root=document) => root.querySelectorAll('.card[data-video], .product[data-video]').forEach(el => {
      if (bound.has(el)) return; bound.add(el);
      ['mouseenter','focusin'].forEach(ev => el.addEventListener(ev, ()=>show(el)));
      ['mouseleave','focusout'].forEach(ev => el.addEventListener(ev, hide));
      el.addEventListener('touchstart', ()=>show(el), { passive:true });
    });

    addEventListener('scroll', ()=>cur && place(cur), { passive:true });
    addEventListener('resize', ()=>cur && place(cur));
    document.addEventListener('DOMContentLoaded', ()=>attach());

    window.bindPreview = attach;
    return { bind: attach };
  })();

  /* [7] HARVEST products → localStorage (for list.html fallback) */
  (() => {
    const grid = $('.product-grid'); if (!grid) return;
    const cards = grid.querySelectorAll('.product'); if (!cards.length) return;
    const toUrl = bg => (bg||'').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    const out=[]; let i=0;

    cards.forEach(card=>{
      const title = card.querySelector('.p-title')?.textContent.trim() || 'Game '+(++i);
      const price = +(card.querySelector('.p-price')?.textContent||'').replace(/[^\d]/g,'')||0;
      const thumb = toUrl(getComputedStyle(card.querySelector('.thumb')).backgroundImage);
      const video = card.dataset.video || '';
      const badge = (card.querySelector('.p-badge')?.textContent||'').trim().toLowerCase();
      const tags=[], cats=[], modes=[], plats=[];
      if (badge.includes('việt')) tags.push('viet-hoa');
      if (badge.includes('sports')) cats.push('the-thao');
      if (badge.includes('action')) cats.push('hanh-dong');
      if (badge.includes('indie')) cats.push('indie');
      if (badge.includes('pc')) plats.push('pc');
      if (/online/i.test(title)||badge.includes('online')) modes.push('online');
      if (badge.includes('offline')||badge.includes('pc')) modes.push('offline');
      if (!modes.length) modes.push('offline');
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'item-'+i;
      out.push({ id, title, price, thumb, video, categories:cats, tags, platforms:plats, modes,
        releaseDate:new Date(Date.now()-i*86400000).toISOString().slice(0,10) });
    });
    out.length && localStorage.setItem('site_games', JSON.stringify(out));
  })();

  /* [8] PAGINATION + SORTING (Home) */
  (() => {
    const grid=$('.product-grid'), pager=$('#pager');
    if (!grid||!pager) return;
    const sortSel=$('#sortSelect'), sizeSel=$('#pageSize');
    const items=[...grid.querySelectorAll('.product')].map((el,i)=>({
      el, price:+(el.dataset.price||el.querySelector('.p-price')?.textContent.replace(/[^\d]/g,'')||0),
      titleLower:(el.dataset.title||el.querySelector('.p-title')?.textContent||'').toLowerCase(),
      date:Date.parse(el.dataset.date||'') || (Date.now()-i*86400000)
    }));
    let sort=sortSel?.value||'newest', size=+sizeSel?.value||12, page=1;
    const cmp={priceAsc:(a,b)=>a.price-b.price,priceDesc:(a,b)=>b.price-a.price,
               titleAsc:(a,b)=>a.titleLower.localeCompare(b.titleLower),
               titleDesc:(a,b)=>b.titleLower.localeCompare(a.titleLower),
               newest:(a,b)=>b.date-a.date};

    const btn=(lab,p,cur,dis=false)=>Object.assign(document.createElement('button'),{
      type:'button',textContent:lab,disabled:dis,onclick:()=>{page=p;render();},
      ...(p===cur?{'aria-current':'page'}:{})
    });

    const renderPager = pages => {
      pager.innerHTML=''; if (pages<=1) return;
      pager.append(btn('«',Math.max(1,page-1),page,page===1));
      const MAX=7,set=new Set([1,2,page-1,page,page+1,pages-1,pages]);
      [...set].filter(p=>p>=1&&p<=pages).sort((a,b)=>a-b)
        .reduce((prev,p)=>{ if(prev&&p-prev>1)pager.append(Object.assign(document.createElement('span'),{className:'gap',textContent:'…'}));
                            pager.append(btn(p,p,page)); return p; },0);
      pager.append(btn('»',Math.min(pages,page+1),page,page===pages));
    };

    const render = () => {
      const sorted=[...items].sort(cmp[sort]||cmp.newest);
      const pages=Math.ceil(sorted.length/size)||1; page=Math.min(page,pages);
      grid.innerHTML=''; sorted.slice((page-1)*size, page*size).forEach(i=>grid.append(i.el));
      window.bindPreview?.(grid); window.ensureQuickAdd?.(); renderPager(pages);
      document.dispatchEvent(new Event('lazygrid:render'));
    };

    sortSel?.addEventListener('change', e=>{sort=e.target.value;page=1;render();});
    sizeSel?.addEventListener('change', e=>{size=+e.target.value;page=1;render();});
    render();
  })();

  /* [9] Logo & Menu "Home" link */
  (() => {
    const HOME='index.html';
    $('a.logo')?.addEventListener('click', e => { e.preventDefault(); location.href=HOME; });
    $$('.menu a').forEach(a=>{
      const txt=a.textContent.trim().toLowerCase(), href=a.getAttribute('href')||'';
      if (txt==='home' && (!href||href==='#'))
        a.addEventListener('click', e=>{ e.preventDefault(); location.href=HOME; });
    });
  })();
})();
