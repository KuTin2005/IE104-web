/* ===== Account popover + login state (localStorage) ===== */
(() => {
  const accBtn = document.querySelector('.icon-btn[data-role="account"]');
  if (!accBtn) return;

  const pop = document.createElement('div');
  pop.className = 'account-pop';
  document.body.appendChild(pop);

  const getAcc = () => {
    try { return JSON.parse(localStorage.getItem('account') || 'null'); }
    catch { return null; }
  };

  const place = () => {
    const r = accBtn.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 300, r.left);
    pop.style.left = left + 'px';
    pop.style.top  = (r.bottom + 10) + 'px';
  };

  const render = () => {
    const acc = getAcc();
    if (acc) {
      pop.innerHTML = `
        <div class="title">Tài khoản</div>
        <div class="row"><strong>${acc.name || 'Người dùng'}</strong></div>
        <div class="row">Email: ${acc.email || '-'}</div>
        <div class="row">SĐT: ${acc.phone || '-'}</div>
        <div class="actions">
          <button class="btn" id="logoutBtn">Đăng xuất</button>
        </div>`;
      pop.querySelector('#logoutBtn').onclick = () => {
        localStorage.removeItem('account'); pop.classList.remove('show');
      };
    } else {
      pop.innerHTML = `
        <div class="title">Chưa đăng nhập</div>
        <div class="row">Hãy đăng nhập hoặc đăng ký để sử dụng đầy đủ tính năng.</div>
        <div class="actions">
          <a class="btn primary" href="auth.html?tab=login">Đăng nhập</a>
          <a class="btn" href="auth.html?tab=register">Đăng ký</a>
        </div>`;
    }
  };

  let hideTm = 0;
  const show = () => { clearTimeout(hideTm); render(); place(); pop.classList.add('show'); };
  const hide = () => { hideTm = setTimeout(()=> pop.classList.remove('show'), 80); };

  accBtn.addEventListener('mouseenter', show);
  accBtn.addEventListener('mouseleave', hide);
  pop.addEventListener('mouseenter', () => clearTimeout(hideTm));
  pop.addEventListener('mouseleave', hide);
  addEventListener('scroll', () => pop.classList.contains('show') && place(), {passive:true});
  addEventListener('resize', () => pop.classList.contains('show') && place());
})();
