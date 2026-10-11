const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}

/* Back to top: keep fragment links on the current page even when a <base> tag is present. */
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href="#top"]');
  if(!link)return;
  event.preventDefault();
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({top:0,left:0,behavior:reduceMotion?'auto':'smooth'});
});

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

const search=document.getElementById('bookSearch');
const initialBookQuery=new URLSearchParams(location.search).get('q');
if(search&&initialBookQuery)search.value=initialBookQuery;
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

/* Latest writings on the homepage. Content comes from /posts/*.mjs via posts-manifest.js. */
(() => {
  const host=document.getElementById('homeWritingsList');
  if(!host)return;
  const lang=document.documentElement.lang==='bn'?'bn':'en';
  const locale=lang==='bn'?'bn-BD':'en-GB';
  const posts=Array.isArray(window.windowOfTimePosts)?window.windowOfTimePosts.slice():[];
  const copy=lang==='bn'?{empty:'এখনও কোনো লেখা যোগ করা হয়নি।',read:'পুরোটি পড়ুন'}:{empty:'No writings have been added yet.',read:'View Full'};
  const parseDate=v=>{const d=new Date(`${v||''}T12:00:00`);return Number.isNaN(d.getTime())?null:d;};
  const fmt=v=>{const d=parseDate(v);return d?new Intl.DateTimeFormat(locale,{year:'numeric',month:'short',day:'numeric'}).format(d):'';};
  const clean=body=>String(body||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).filter(line=>!/^\*{3}(?:\s+\*{3})+$/u.test(line)&&!/^<{3}.*>{3}$/u.test(line)).map(line=>line.replace(/^#\s*/u,'')).join(' ').replace(/\s+/g,' ').trim();
  const excerpt=(body,max=180)=>{const t=clean(body);if(t.length<=max)return t;const cut=t.slice(0,max);const stop=Math.max(cut.lastIndexOf('।'),cut.lastIndexOf('.'),cut.lastIndexOf(' '));return `${cut.slice(0,stop>95?stop:max).trim()}…`;};
  const slugify=text=>String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u0980-\u09ff]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
  const postId=(post,index)=>post.id?String(post.id):`${post.date||'undated'}-${slugify(post.en?.title||post.bn?.title||`post-${index+1}`)||`post-${index+1}`}`;
  posts.sort((a,b)=>(parseDate(b.date)?.getTime()||0)-(parseDate(a.date)?.getTime()||0));
  host.replaceChildren();
  if(!posts.length){const p=document.createElement('p');p.className='page-lead';p.textContent=copy.empty;host.appendChild(p);return;}
  posts.slice(0,3).forEach((post,index)=>{
    const loc=post?.[lang]||post?.en||post?.bn||{};
    const a=document.createElement('a');a.className='home-writing-item';a.href=`writings/${encodeURIComponent(postId(post,index))}.html`;
    const time=document.createElement('time');time.dateTime=post.date||'';time.textContent=fmt(post.date);
    const c=document.createElement('div');c.className='home-writing-copy';
    const h=document.createElement('h3');h.textContent=loc.title||'';
    const p=document.createElement('p');p.textContent=loc.excerpt||excerpt(loc.body);
    c.append(h,p);
    const action=document.createElement('span');action.className='home-writing-action';action.textContent=`${copy.read} →`;
    a.append(time,c,action);host.appendChild(a);
  });
})();

/* Bengali display digits: 0-9 -> ০-৯ */
(() => {
  if(document.documentElement.lang!=='bn')return;

  const map={'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
  const toBnDigits=value=>String(value??'').replace(/[0-9]/g,d=>map[d]);

  const skipParent=el=>{
    if(!el||el.nodeType!==Node.ELEMENT_NODE)return false;
    return Boolean(el.closest('script,style,code,pre,kbd,samp,[data-keep-latin-digits]'));
  };

  const convertTextNode=node=>{
    if(!node||node.nodeType!==Node.TEXT_NODE||skipParent(node.parentElement))return;
    if(/[0-9]/.test(node.nodeValue||''))node.nodeValue=toBnDigits(node.nodeValue);
  };

  const convertElement=root=>{
    if(!root)return;
    if(root.nodeType===Node.TEXT_NODE){convertTextNode(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE||skipParent(root))return;

    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode()))convertTextNode(node);

    ['placeholder','aria-label','title'].forEach(attr=>{
      if(root.hasAttribute?.(attr)){
        const value=root.getAttribute(attr);
        if(/[0-9]/.test(value||''))root.setAttribute(attr,toBnDigits(value));
      }
      root.querySelectorAll?.(`[${attr}]`).forEach(el=>{
        if(skipParent(el))return;
        const value=el.getAttribute(attr);
        if(/[0-9]/.test(value||''))el.setAttribute(attr,toBnDigits(value));
      });
    });
  };

  convertElement(document.body);

  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      if(mutation.type==='characterData'){
        convertTextNode(mutation.target);
        continue;
      }
      mutation.addedNodes.forEach(convertElement);
    }
  });

  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
})();
