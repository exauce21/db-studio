/* ==========================================================================
   David Banga Studio — scripts
   Chargement, en-tête, parallaxe du hero, galerie (filtres, mosaïque,
   visionneuse), citation animée, liens de contact, curseur.
   ========================================================================== */

(function(){
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const root=document.documentElement;
  root.classList.add('js'); if(!root.lang) root.lang='fr';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const pad=n=>String(n).padStart(2,'0');

  /* split hero name into letters */
  $$('.hero-name .hn-line').forEach(line=>{
    const t=line.textContent; line.textContent='';
    [...t].forEach((c,i)=>{const s=document.createElement('span');s.className='ch';s.style.setProperty('--i',i+(line.classList.contains('hn-banga')?3:0));s.textContent=c;line.appendChild(s);});
  });

  /* loader */
  const loader=$('#loader'), countEl=$('#loaderCount'), bar=$('#loaderBar');
  function reveal(){
    root.classList.add('hero-ready');
    if(!loader) return;
    loader.classList.add('out');
    setTimeout(()=>loader.classList.add('gone'),1100);
  }
  if(reduce){ loader&&loader.classList.add('gone'); root.classList.add('hero-ready'); }
  else{
    root.classList.add('js-anim');
    const imgs=$$('#field img'); let done=0; const total=imgs.length||1;
    const t0=performance.now(); let shown=0, finished=false;
    const bump=()=>{done++;};
    imgs.forEach(im=>{ if(im.complete) bump(); else { im.addEventListener('load',bump,{once:true}); im.addEventListener('error',bump,{once:true}); } });
    (function tick(now){
      const elapsed=now-t0;
      const target=Math.min(100, Math.min(done/total*100, elapsed/1400*100) );
      const forced=elapsed>3600 ? 100 : target;
      shown=lerp(shown,forced,.12); if(forced-shown<.6) shown=forced;
      countEl.textContent=String(Math.round(shown)).padStart(3,'0');
      bar.style.transform='scaleX('+(shown/100)+')';
      if(shown>=100 && !finished){ finished=true; setTimeout(reveal,260); return; }
      requestAnimationFrame(tick);
    })(t0);
  }

  /* header behaviour */
  const head=$('#head'), fab=$('#fab'); let lastY=scrollY;
  function onScroll(){
    const y=scrollY;
    head.classList.toggle('scrolled', y>40);
    const menuOpen=$('#menuBtn').getAttribute('aria-expanded')==='true';
    head.classList.toggle('hide', !menuOpen && y>lastY && y>400);
    lastY=y;
    const c=$('#contact'), h=$('#accueil'); fab.classList.toggle('away', (h && y < h.offsetHeight*.55) || (c && c.getBoundingClientRect().top < innerHeight*.6));
  }
  addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* active nav link */
  const navLinks=$$('.nav a');
  const io=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ navLinks.forEach(a=>a.classList.toggle('on', a.getAttribute('href')==='#'+e.target.id)); } });},{rootMargin:'-45% 0px -50% 0px'});
  ['realisations','a-propos','services','portfolios','contact'].forEach(id=>{const el=document.getElementById(id); el&&io.observe(el);});

  /* mobile menu */
  const menuBtn=$('#menuBtn'), mnav=$('#mnav');
  function setMenu(open){ menuBtn.setAttribute('aria-expanded',open); mnav.classList.toggle('open',open); root.style.overflow=open?'hidden':''; if(open) head.classList.remove('hide'); }
  menuBtn.addEventListener('click',()=>setMenu(menuBtn.getAttribute('aria-expanded')!=='true'));
  mnav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));

  /* hero parallax field */
  const frames=$$('.pf'); const hero=$('#accueil');
  let mx=0,my=0,cx=0,cy=0, heroVisible=true;
  new IntersectionObserver(es=>{heroVisible=es[0].isIntersecting;}).observe(hero);
  if(!reduce){
    addEventListener('mousemove',e=>{ mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2; },{passive:true});
    (function loop(){
      if(heroVisible){
        cx=lerp(cx,mx,.06); cy=lerp(cy,my,.06);
        const sy=scrollY;
        frames.forEach(f=>{ const d=parseFloat(f.dataset.depth)||.1; f.style.transform=`translate3d(${(-cx*d*260).toFixed(1)}px,${(-cy*d*200 - sy*d*2.2).toFixed(1)}px,0)`; });
      }
      requestAnimationFrame(loop);
    })();
  }

  /* gallery data */
  const items=$$('.g-item');
  let visible=items.slice();
  const status=$('#gStatus');
  const chips=$$('.chip');
  const catLabel={};
  chips.forEach(c=>{catLabel[c.dataset.filter]=c.dataset.label;});

  const gallery=$('#gallery');
  function layout(){
    const cols=innerWidth<=1080?2:3;
    gallery.classList.add('masonry'); gallery.style.setProperty('--cols',cols);
    const gap=parseFloat(getComputedStyle(gallery).columnGap)||16;
    const colW=(gallery.clientWidth-gap*(cols-1))/cols;
    const tops=new Array(cols).fill(0);            /* shortest-column masonry, in reading order */
    items.forEach(it=>{
      if(it.hidden) return;
      const im=it.querySelector('img'); const w=+im.getAttribute('width'), h=+im.getAttribute('height');
      const span=Math.ceil((colW*h/w+gap)/4);
      let c=0; for(let k=1;k<cols;k++) if(tops[k]<tops[c]-2) c=k;
      it.style.gridColumn=String(c+1); it.style.gridRow=(tops[c]+1)+' / span '+span;
      tops[c]+=span;
    });
  }
  layout(); let rz; addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(layout,120);});

  function applyFilter(f, scroll){
    chips.forEach(c=>c.setAttribute('aria-pressed', c.dataset.filter===f));
    const show=it=>f==='all'||it.dataset.cat===f;
    items.forEach(it=>{ if(!show(it)) it.classList.add('fading'); });
    setTimeout(()=>{
      items.forEach(it=>{ const s=show(it); it.hidden=!s; if(s){ it.classList.add('fading'); requestAnimationFrame(()=>requestAnimationFrame(()=>it.classList.remove('fading'))); } });
      visible=items.filter(show); layout();
      status.textContent=visible.length+' image'+(visible.length>1?'s':'')+' affichée'+(visible.length>1?'s':'')+(f==='all'?'':' — '+catLabel[f]);
    }, reduce?0:260);
    if(scroll){ const g=$('#filters'); const y=g.getBoundingClientRect().top+scrollY-110; scrollTo({top:y,behavior:reduce?'auto':'smooth'}); }
  }
  chips.forEach(c=>c.addEventListener('click',()=>applyFilter(c.dataset.filter,false)));
  $$('.s-row').forEach(r=>r.addEventListener('click',()=>applyFilter(r.dataset.filter,true)));

  /* series hover peek */
  const peek=$('#peek'), peekImg=$('#peekImg');
  if(fine && !reduce){
    let px=0,py=0,tx=0,ty=0,on=false,cyc=null;
    const srcs=f=>items.filter(i=>i.dataset.cat===f).map(i=>i.querySelector('img').getAttribute('src'));
    $$('.s-row').forEach(r=>{
      r.addEventListener('mouseenter',()=>{ const list=srcs(r.dataset.filter); let k=0; peekImg.src=list[0]; peek.classList.add('on'); on=true; clearInterval(cyc); cyc=setInterval(()=>{k=(k+1)%list.length; peekImg.src=list[k];},650); });
      r.addEventListener('mouseleave',()=>{ peek.classList.remove('on'); on=false; clearInterval(cyc); });
    });
    addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;},{passive:true});
    (function pl(){ px=lerp(px,tx,.14); py=lerp(py,ty,.14); peek.style.left=px+'px'; peek.style.top=py+'px'; requestAnimationFrame(pl); })();
  }

  /* lightbox */
  const lb=$('#lb'), lbImg=$('#lbImg'), lbCount=$('#lbCount'), lbCat=$('#lbCat'), lbCap=$('#lbCap'), lbExif=$('#lbExif');
  let cur=0, lastFocus=null;
  function show(i){
    cur=(i+visible.length)%visible.length;
    const it=visible[cur], im=it.querySelector('img');
    lbImg.classList.add('swap');
    const src=im.dataset.full;
    const pre=new Image(); pre.src=src;
    const go=()=>{ lbImg.src=src; lbImg.alt=im.alt; lbImg.classList.remove('swap'); };
    if(pre.complete) go(); else { lbImg.src=im.getAttribute('src'); lbImg.alt=im.alt; pre.onload=go; pre.onerror=go; setTimeout(()=>lbImg.classList.remove('swap'),120); }
    lbCount.textContent=pad(cur+1)+' / '+pad(visible.length);
    lbCat.textContent=catLabel[it.dataset.cat]||'';
    lbCap.textContent=im.alt;
    lbExif.textContent=it.dataset.exif||'';
    [1,-1].forEach(d=>{ const n=visible[(cur+d+visible.length)%visible.length]; if(n){ const p=new Image(); p.src=n.querySelector('img').dataset.full; } });
  }
  function open(it){
    let i=visible.indexOf(it);
    if(i<0){ applyFilter('all'); visible=items.slice(); i=items.indexOf(it); }
    lastFocus=document.activeElement; lb.hidden=false; root.style.overflow='hidden';
    requestAnimationFrame(()=>lb.classList.add('open'));
    show(i); $('#lbClose').focus();
  }
  function close(){ lb.classList.remove('open'); root.style.overflow=''; setTimeout(()=>{lb.hidden=true;},reduce?0:300); lastFocus&&lastFocus.focus&&lastFocus.focus(); }
  items.forEach(it=>it.querySelector('.g-open').addEventListener('click',()=>open(it)));
  frames.forEach(f=>f.addEventListener('click',()=>{ const it=items.find(i=>i.dataset.slug===f.dataset.slug); it&&open(it); }));
  $('#lbClose').addEventListener('click',close);
  $('#lbPrev').addEventListener('click',()=>show(cur-1));
  $('#lbNext').addEventListener('click',()=>show(cur+1));
  lb.addEventListener('click',e=>{ if(e.target===lb||e.target.id==='lbStage') close(); });
  addEventListener('keydown',e=>{
    if(lb.hidden) { if(e.key==='Escape' && menuBtn.getAttribute('aria-expanded')==='true') setMenu(false); return; }
    if(e.key==='Escape') close();
    else if(e.key==='ArrowRight') show(cur+1);
    else if(e.key==='ArrowLeft') show(cur-1);
    else if(e.key==='Tab'){ const f=[...lb.querySelectorAll('button')]; const a=f.indexOf(document.activeElement); if(e.shiftKey && a<=0){e.preventDefault();f[f.length-1].focus();} else if(!e.shiftKey && a===f.length-1){e.preventDefault();f[0].focus();} }
  });
  let sx=null,sy0=null;
  $('#lbStage').addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy0=e.touches[0].clientY;},{passive:true});
  $('#lbStage').addEventListener('touchend',e=>{ if(sx===null) return; const dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy0; if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)) show(cur+(dx<0?1:-1)); sx=null; });

  /* quote: letters ride a U-curve into place as you scroll */
  const q=$('#qText');
  if(q && !reduce){
    const chars=[];
    (function split(node){
      [...node.childNodes].forEach(n=>{
        if(n.nodeType===3){
          const frag=document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(tok=>{
            if(!tok) return;
            if(/^\s+$/.test(tok)){ frag.appendChild(document.createTextNode(' ')); return; }
            const w=document.createElement('span'); w.className='w';
            [...tok].forEach(c=>{const s=document.createElement('span');s.className='qc';s.textContent=c;w.appendChild(s);chars.push(s);});
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if(n.nodeType===1) split(n);
      });
    })(q);
    q.setAttribute('aria-label', q.textContent);
    const N=chars.length, mid=(N-1)/2;
    const ease=t=>1-Math.pow(1-t,3);
    function qUpdate(){
      const r=q.getBoundingClientRect();
      const p=Math.min(1,Math.max(0,(innerHeight - r.top)/(innerHeight*.6)));
      chars.forEach((c,i)=>{
        const centrality=1-Math.abs(i-mid)/mid;           /* 0 at edges, 1 in the middle */
        const local=Math.min(1,Math.max(0,(p - centrality*.45)/.55));
        c.style.transform='translateY('+((1-ease(local))*0.55).toFixed(3)+'em)';
      });
    }
    addEventListener('scroll',()=>requestAnimationFrame(qUpdate),{passive:true}); addEventListener('resize',qUpdate); qUpdate();
  }

  /* barrel links */
  $$('.barrel').forEach(a=>{
    const label=a.dataset.label; a.textContent='';
    a.setAttribute('aria-label',label);
    const l=document.createElement('span'); l.className='bk l'; l.textContent='['; l.setAttribute('aria-hidden','true');
    const w=document.createElement('span'); w.className='word'; w.setAttribute('aria-hidden','true');
    [...label].forEach((c,i)=>{ const b=document.createElement('span'); b.className='bc'; b.style.setProperty('--i',i); b.innerHTML='<span></span><span></span>'; b.children[0].textContent=c; b.children[1].textContent=c; w.appendChild(b); });
    const r=document.createElement('span'); r.className='bk r'; r.textContent=']'; r.setAttribute('aria-hidden','true');
    a.append(l,w,r);
  });

  /* copy buttons */
  $$('.copy').forEach(b=>b.addEventListener('click',()=>{
    const v=b.dataset.copy;
    const ok=()=>{ b.textContent='Copié'; b.classList.add('ok'); setTimeout(()=>{b.textContent='Copier';b.classList.remove('ok');},1800); };
    const fallback=()=>{ const el=b.previousElementSibling; const range=document.createRange(); range.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(range); b.textContent='Sélectionné'; setTimeout(()=>{b.textContent='Copier';},1800); };
    try{ navigator.clipboard.writeText(v).then(ok,fallback); }catch(e){ fallback(); }
  }));

  /* Dakar clock */
  const clock=$('#clock');
  function tickClock(){ try{ clock.textContent=new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Africa/Dakar'}).format(new Date())+' (GMT+0)'; }catch(e){} }
  tickClock(); setInterval(tickClock,1000);
  $('#year').textContent=new Date().getFullYear();

  /* custom cursor */
  if(fine && !reduce){
    root.classList.add('has-cursor');
    const cur$=$('#cursor'), dot=$('#cDot'), ring=$('#cRing'), lab=$('#cLabel');
    let x=-100,y=-100,rx=-100,ry=-100;
    addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY;if(rx<-50){rx=x;ry=y;}cur$.classList.add('live');},{passive:true});
    document.addEventListener('mouseover',e=>{
      const z=e.target.closest('.g-open,.pf'); const l=e.target.closest('a,button,[data-cursor]');
      cur$.classList.toggle('big',!!z); cur$.classList.toggle('link',!z&&!!l);
      if(z) lab.textContent='Voir';
    });
    document.addEventListener('mouseleave',()=>{cur$.classList.remove('live');});
    (function cl(){ rx=lerp(rx,x,.18); ry=lerp(ry,y,.18); dot.style.transform=`translate3d(${x}px,${y}px,0)`; ring.style.transform=`translate3d(${rx}px,${ry}px,0)`; requestAnimationFrame(cl); })();
  }
})();
