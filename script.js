const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

const search=document.getElementById('bookSearch');
const cards=[...document.querySelectorAll('.book-card')];
const filterBtns=[...document.querySelectorAll('.filter-btn')];
const empty=document.getElementById('bookEmpty');
let activeFilter='All';
function applyBooks(){if(!cards.length)return;const q=(search?.value||'').trim().toLowerCase();let shown=0;cards.forEach(card=>{const matchFilter=activeFilter==='All'||card.dataset.category===activeFilter;const matchSearch=!q||card.dataset.title.includes(q);const show=matchFilter&&matchSearch;card.hidden=!show;if(show)shown++;});if(empty)empty.hidden=shown!==0;}
filterBtns.forEach(btn=>btn.addEventListener('click',()=>{filterBtns.forEach(b=>b.classList.remove('active'));btn.classList.add('active');activeFilter=btn.dataset.filter;applyBooks();}));
if(search)search.addEventListener('input',applyBooks);

/* Site updates are authored one-file-per-update in /updates.
   updates-manifest.js is generated automatically by GitHub Actions. */
(() => {
  const lang=document.documentElement.lang==='bn'?'bn':'en';
  const locale=lang==='bn'?'bn-BD':'en-US';
  const raw=Array.isArray(window.ahmadAliUpdates)?window.ahmadAliUpdates.slice():[];

  function parseDate(value){
    const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m)return null;
    const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
    return Number.isNaN(d.getTime())?null:d;
  }
  function localized(item){return item?.[lang]||item?.en||item?.bn||{};}
  function formatDate(value){
    const d=parseDate(value); if(!d)return '';
    return new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',day:'numeric'}).format(d);
  }
  function startOfToday(){const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate(),23,59,59,999);}

  const today=startOfToday();
  const visible=raw
    .filter(item=>{const d=parseDate(item.date);return d&&d<=today;})
    .sort((a,b)=>(parseDate(b.date)?.getTime()||0)-(parseDate(a.date)?.getTime()||0)||String(a.id||'').localeCompare(String(b.id||'')));
  const latest15=visible.slice(0,15);

  function makeUpdateRow(item){
    const data=localized(item);
    const href=String(item.href||'').trim();
    const outer=document.createElement(href?'a':'article');
    outer.className='recent-update-item';
    if(href)outer.href=href;
    const time=document.createElement('time');
    time.dateTime=item.date||'';
    time.textContent=formatDate(item.date);
    const copy=document.createElement('div'); copy.className='recent-update-copy';
    const h3=document.createElement('h3'); h3.textContent=data.title||'';
    copy.appendChild(h3);
    if(data.summary){const p=document.createElement('p');p.textContent=data.summary;copy.appendChild(p);}
    const arrow=document.createElement('span');arrow.className='recent-update-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent=href?'→':'';
    outer.append(time,copy,arrow);
    return outer;
  }

  const recent=document.getElementById('recentUpdatesList');
  if(recent){
    recent.replaceChildren();
    if(latest15.length){latest15.forEach(item=>recent.appendChild(makeUpdateRow(item)));}
    else{const p=document.createElement('p');p.className='page-lead';p.textContent=lang==='bn'?'এখনও কোনো আপডেট যোগ করা হয়নি।':'No updates have been added yet.';recent.appendChild(p);}
    const more=document.getElementById('recentUpdatesViewMore');
    if(more)more.hidden=visible.length<=15;
  }

  const all=document.getElementById('allUpdatesList');
  if(all){
    all.replaceChildren();
    if(visible.length){visible.forEach(item=>all.appendChild(makeUpdateRow(item)));}
    else{const p=document.createElement('p');p.className='page-lead';p.textContent=lang==='bn'?'এখনও কোনো আপডেট যোগ করা হয়নি।':'No updates have been added yet.';all.appendChild(p);}
  }

  const ticker=document.querySelector('.updates-ticker');
  if(!ticker)return;
  const viewport=ticker.querySelector('.update-viewport');
  if(!viewport)return;

  const now=new Date();
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1,0,0,0,0);
  const fifteenDaysAgo=new Date(now.getFullYear(),now.getMonth(),now.getDate()-15,0,0,0,0);
  // "current month OR last 15 days" = union of the two windows.
  const recentThreshold=monthStart<fifteenDaysAgo?monthStart:fifteenDaysAgo;
  const bannerItems=latest15.filter(item=>{
    const d=parseDate(item.date);
    return d&&d>=recentThreshold&&d<=today;
  }).slice(0,5);

  if(!bannerItems.length){ticker.hidden=true;return;}
  ticker.hidden=false;
  const spacer='\u00A0'.repeat(10);
  const makeSet=(duplicate=false)=>{
    const set=document.createElement('div');set.className='update-set';
    bannerItems.forEach(item=>{
      const data=localized(item);
      const href=String(item.href||'').trim();
      const node=document.createElement(href?'a':'span');
      node.className='update-link';
      if(href)node.href=href;
      node.textContent=data.title||'';
      if(duplicate&&href)node.tabIndex=-1;
      set.appendChild(node);
      const gap=document.createElement('span');gap.className='update-gap';gap.setAttribute('aria-hidden','true');gap.textContent=spacer;set.appendChild(gap);
    });
    return set;
  };
  viewport.replaceChildren();viewport.removeAttribute('aria-live');
  const track=document.createElement('div');track.className='update-track';
  const firstSet=makeSet(false);const secondSet=makeSet(true);secondSet.setAttribute('aria-hidden','true');
  track.append(firstSet,secondSet);viewport.appendChild(track);

  const signature=bannerItems.map(x=>`${x.id||''}:${x.date||''}`).join('|');
  let hash=0;for(let i=0;i<signature.length;i++)hash=((hash<<5)-hash+signature.charCodeAt(i))|0;
  const epochKey=`ahmadAliUpdatesEpoch:${lang}:${Math.abs(hash)}`;
  let epoch=0;try{epoch=Number(localStorage.getItem(epochKey));}catch(_e){}
  if(!Number.isFinite(epoch)||epoch<=0){epoch=Date.now();try{localStorage.setItem(epochKey,String(epoch));}catch(_e){}}

  const startMarquee=()=>{
    const cycleWidth=firstSet.getBoundingClientRect().width;if(!cycleWidth)return;
    const pixelsPerSecond=48;const duration=cycleWidth/pixelsPerSecond;const elapsed=(Date.now()-epoch)/1000;const phase=((elapsed%duration)+duration)%duration;
    track.style.setProperty('--marquee-shift',`-${cycleWidth}px`);track.style.setProperty('--marquee-duration',`${duration}s`);track.style.animationDelay=`-${phase}s`;ticker.classList.add('marquee-ready');
  };
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>requestAnimationFrame(startMarquee));}else{requestAnimationFrame(startMarquee);}
})();
