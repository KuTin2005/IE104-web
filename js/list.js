// file: js/list.js — dùng JSON nếu có, fallback localStorage, hỗ trợ q=
(function(){
  const grid  = document.getElementById('grid');
  const pager = document.getElementById('pager');
  const titleEl = document.getElementById('page-title') || document.getElementById('pageTitle');
  const crumbEl = document.getElementById('crumb');
  const sortEl  = document.getElementById('sort') || document.getElementById('sortSelect');
  const sizeSel = document.getElementById('pageSize');

  const qs = new URLSearchParams(location.search);
  const scope = (qs.get('scope') || '').toLowerCase();       // online|offline
  const category = (qs.get('category') || '').toLowerCase(); // hanh-dong|...
  const query = (qs.get('q') || '').trim().toLowerCase();    // search

  const LABEL = { online:'Game Online', offline:'Game Offline' };
  const CAT_LABEL = {
    'hanh-dong':'Thể loại: Hành động','nhap-vai':'Thể loại: Nhập vai',
    'ban-sung':'Thể loại: Bắn súng','mo-phong':'Thể loại: Mô phỏng',
    'the-thao':'Thể loại: Thể thao'
  };

  let page = 1, pageSize = +(sizeSel?.value || 12);
  let all=[], view=[];

  function setHeading(){
    let name='Danh sách';
    if (scope && LABEL[scope]) name=LABEL[scope];
    if (category && CAT_LABEL[category]) name=CAT_LABEL[category];
    if (query) name = `Kết quả cho “${qs.get('q')}”`;
    titleEl && (titleEl.textContent=name);
    crumbEl && (crumbEl.textContent=name);
    document.title = name + ' — ĐỨC TIẾN GAMINGZONE';
  }
  const money = n => (n||0).toLocaleString('vi-VN')+'đ';
  const tpl = g => `
<article class="product" ${g.video?`data-video="${g.video}"`:''}>
  <div class="thumb" style="background-image:url('${g.thumb}')"></div>
  <h3 class="p-title">${g.title}</h3>
  <div class="p-meta">
    <span class="p-price">${money(g.price)}</span>
    <span class="p-badge">${
      (g.tags||[]).includes('viet-hoa') ? 'Việt hoá'
      : (g.categories||[]).includes('the-thao') ? 'Sports'
      : (g.categories||[]).includes('hanh-dong') ? 'Action' : 'PC'
    }</span>
  </div>
</article>`;

  const inScope   = g => !scope    || (g.modes||[]).includes(scope);
  const inCat     = g => !category || (g.categories||[]).includes(category);
  const inQuery   = g => !query    || g.title.toLowerCase().includes(query);
  const sortItems = arr => {
    switch (sortEl?.value){
      case 'priceAsc':  return arr.sort((a,b)=>a.price-b.price);
      case 'priceDesc': return arr.sort((a,b)=>b.price-a.price);
      case 'titleAsc':  return arr.sort((a,b)=>a.title.localeCompare(b.title));
      case 'titleDesc': return arr.sort((a,b)=>b.title.localeCompare(a.title));
      case 'newest': default:       return arr.sort((a,b)=>new Date(b.releaseDate||0)-new Date(a.releaseDate||0));
    }
  };

  function render(){
    const total = view.length;
    const pages = Math.max(1, Math.ceil(total/pageSize));
    if (page>pages) page = pages;

    const start=(page-1)*pageSize;
    grid.innerHTML = view.slice(start,start+pageSize).map(tpl).join('') || '<p>Không có game phù hợp.</p>';

    // re-bind preview & quick-add
    window.bindPreview?.(grid);
    window.ensureQuickAdd?.();

    pager.innerHTML = '';
    if (pages>1){
      const add = (p, lab=p, dis=false)=>{
        const b=document.createElement('button');
        b.textContent=lab; if(dis)b.disabled=true; if(p===page)b.setAttribute('aria-current','page');
        b.onclick=()=>{ page=p; render(); };
        return b;
      };
      pager.appendChild(add(Math.max(1,page-1),'«', page===1));
      const MAX=7;
      if (pages<=MAX){ for(let i=1;i<=pages;i++) pager.appendChild(add(i)); }
      else{
        const set=new Set([1,2,page-1,page,page+1,pages-1,pages]);
        const list=[...set].filter(p=>p>=1&&p<=pages).sort((a,b)=>a-b);
        let prev=0; for(const p of list){
          if(prev && p-prev>1){ const gap=document.createElement('span'); gap.className='gap'; gap.textContent='…'; pager.appendChild(gap); }
          pager.appendChild(add(p)); prev=p;
        }
      }
      pager.appendChild(add(Math.min(pages,page+1),'»', page===pages));
    }
  }

  function apply(){
    view = all.filter(g => inScope(g) && inCat(g) && inQuery(g));
    if (scope==='online' && view.length===0){
      view = all.filter(g=>{
        const t=g.title.toLowerCase();
        return t.includes('online') || t.includes('pass') ||
               (g.categories||[]).includes('the-thao') || (g.categories||[]).includes('hanh-dong');
      });
    }
    sortItems(view); page=1; render();
  }

  setHeading();
  sortEl?.addEventListener('change', apply);
  sizeSel?.addEventListener('change', e=>{ pageSize=+e.target.value; page=1; render(); });

  (async function load(){
    const CANDIDATES=['data/games.json','games.json','game.json'];
    for (const url of CANDIDATES){
      try{
        const res=await fetch(url,{cache:'no-store'});
        if (res.ok){
          const arr=await res.json();
          if (Array.isArray(arr)&&arr.length){ all=arr; apply(); return; }
        }
      }catch{}
    }
    try{
      const local=JSON.parse(localStorage.getItem('site_games')||'[]');
      if (Array.isArray(local)&&local.length){ all=local; apply(); return; }
    }catch{}
    all=[]; apply();
  })();
})();
