/* ===== Cart + Quick Add (localStorage) ===== */
(()=>{
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const CART_KEY='cart_items';
  const read=()=>{ try{ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }catch{ return []; } };
  const save=a=>localStorage.setItem(CART_KEY, JSON.stringify(a));
  const add =item=>{ const a=read(); a.push(item); save(a); updateCount(); renderCartPop(); };

  const priceOf = t => +t.replace(/[^\d]/g,'') || 0;

  /* Badge số lượng */
  const countEl = $('#cartCount');
  const updateCount = ()=>{ const n = read().length; if (countEl) countEl.textContent = String(n); };
  window.updateCartCount = updateCount; // optional expose
  updateCount();

  /* Quick Add cho thẻ product có đủ thumb + price */
  function ensureQuickAdd(){
    $$('.product').forEach(card=>{
      if (card.querySelector('.quick-add')) return;
      const hasPrice = !!card.querySelector('.p-price');
      const hasThumb = !!card.querySelector('.thumb');
      if (!hasPrice || !hasThumb) return;         // KHÔNG gắn ở liên hệ/hướng dẫn

      const btn = document.createElement('button');
      btn.className='quick-add';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6h15l-1.5 9h-12zM6 6l-1-3H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/>
        </svg>
        <span>Thêm vào giỏ</span>`;
      card.appendChild(btn);

      btn.addEventListener('click', e=>{
        e.stopPropagation();
        const title = card.querySelector('.p-title')?.textContent.trim() || 'Sản phẩm';
        const price = priceOf(card.querySelector('.p-price')?.textContent || '0');
        const style = getComputedStyle(card.querySelector('.thumb'));
        const img = (style.backgroundImage || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        add({ title, price, img });
      });
    });
  }
  ensureQuickAdd();
  window.ensureQuickAdd = ensureQuickAdd; // để main.js/list.js gọi sau mỗi render

  /* Popover giỏ hàng */
  const cartBtn = $('.icon-btn[data-role="cart"], .actions .icon-btn:nth-child(2)'); // fallback
  if (cartBtn){
    const pop=document.createElement('div'); pop.className='cart-pop'; document.body.appendChild(pop);

    const place=()=>{
      const r=cartBtn.getBoundingClientRect();
      const left = Math.min(innerWidth - 300, r.left);
      pop.style.left = (left + scrollX) + 'px';
      pop.style.top  = (r.bottom + 10 + scrollY) + 'px';
    };

    const render=()=>{
      const items=read();
      if (!items.length){
        pop.innerHTML = `<div class="title">Giỏ hàng</div><div class="row">Chưa có sản phẩm nào.</div>`;
        return;
      }
      const html = items.map(i=>`
        <div class="row item">
          <img src="${i.img}" alt="" class="thumb">
          <div class="meta">
            <div class="name">${i.title}</div>
            <div class="price">${i.price.toLocaleString('vi-VN')}đ</div>
          </div>
        </div>`).join('');
      const total = items.reduce((s,i)=>s+i.price,0);
      pop.innerHTML = `<div class="title">Giỏ hàng</div>${html}
        <div class="row total">Tổng: ${total.toLocaleString('vi-VN')}đ</div>
        <div class="actions"><button class="btn" id="clearCart">Xoá hết</button></div>`;
      pop.querySelector('#clearCart')?.addEventListener('click', ()=>{ save([]); updateCount(); render(); });
    };
    window.renderCartPop = render;

    let hideTm=0;
    const show=()=>{ clearTimeout(hideTm); render(); place(); pop.classList.add('show'); };
    const hide=()=>{ hideTm=setTimeout(()=>pop.classList.remove('show'),80); };

    cartBtn.addEventListener('mouseenter', show);
    cartBtn.addEventListener('mouseleave', hide);
    pop.addEventListener('mouseenter', ()=>clearTimeout(hideTm));
    pop.addEventListener('mouseleave', hide);
    addEventListener('scroll', ()=> pop.classList.contains('show') && place(), {passive:true});
    addEventListener('resize', ()=> pop.classList.contains('show') && place());
  }

  /* Popover tài khoản (để nguyên ở account.js) */
})();
