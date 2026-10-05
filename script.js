
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

/* Updates ticker / continuous marquee
   Edit only the items below to add/change announcements. Any href works:
   an internal page (e.g. "books.html") or a full external URL. */
const siteUpdates={
  en:[
    {text:'2026 research: “The Islamization of Existing Laws in Bangladesh”',href:'publications.html'},
    {text:'New books: Adhunik Chintadhara O Motobad — Volumes I & II',href:'books.html'},
    {text:'Ongoing project: Zubdatul Bayan — a full Bengali Qur’an tafsir',href:'about.html#research'}
  ],
  bn:[
    {text:'২০২৬ গবেষণা: “বাংলাদেশের বিদ্যমান আইন ইসলামিকরণ”',href:'publications.html'},
    {text:'নতুন গ্রন্থ: আধুনিক চিন্তাধারা ও মতবাদ — ১ম ও ২য় খণ্ড',href:'books.html'},
    {text:'চলমান প্রকল্প: যুবদাতুল বায়ান — পূর্ণাঙ্গ বাংলা তাফসির',href:'about.html#research'}
  ]
};

const ticker=document.querySelector('.updates-ticker');
if(ticker){
  const lang=ticker.dataset.lang==='bn'?'bn':'en';
  const items=siteUpdates[lang]||siteUpdates.en;
  const viewport=ticker.querySelector('.update-viewport');

  if(viewport&&items.length){
    /* Ten visible spaces separate every announcement, including the loop seam. */
    const spacer='\u00A0'.repeat(10);

    const makeSet=(duplicate=false)=>{
      const set=document.createElement('div');
      set.className='update-set';
      items.forEach((item)=>{
        const link=document.createElement('a');
        link.className='update-link';
        link.href=item.href;
        link.textContent=item.text;
        if(duplicate)link.tabIndex=-1;
        set.appendChild(link);

        const gap=document.createElement('span');
        gap.className='update-gap';
        gap.setAttribute('aria-hidden','true');
        gap.textContent=spacer;
        set.appendChild(gap);
      });
      return set;
    };

    viewport.replaceChildren();
    viewport.removeAttribute('aria-live');

    const track=document.createElement('div');
    track.className='update-track';
    const firstSet=makeSet(false);
    const secondSet=makeSet(true);
    secondSet.setAttribute('aria-hidden','true');
    track.append(firstSet,secondSet);
    viewport.appendChild(track);

    /* Keep a common timeline in localStorage so changing pages does not restart
       the banner at announcement #1. */
    const epochKey=`ahmadAliUpdatesEpoch:${lang}`;
    let epoch=0;
    try{epoch=Number(localStorage.getItem(epochKey));}catch(_e){}
    if(!Number.isFinite(epoch)||epoch<=0){
      epoch=Date.now();
      try{localStorage.setItem(epochKey,String(epoch));}catch(_e){}
    }

    const startMarquee=()=>{
      const cycleWidth=firstSet.getBoundingClientRect().width;
      if(!cycleWidth)return;

      const pixelsPerSecond=48;
      const duration=cycleWidth/pixelsPerSecond;
      const elapsed=(Date.now()-epoch)/1000;
      const phase=((elapsed%duration)+duration)%duration;

      track.style.setProperty('--marquee-shift',`-${cycleWidth}px`);
      track.style.setProperty('--marquee-duration',`${duration}s`);
      track.style.animationDelay=`-${phase}s`;
      ticker.classList.add('marquee-ready');
    };

    /* Wait for web fonts when possible, because Bengali/Latin font widths affect
       the exact seamless-loop distance. */
    if(document.fonts&&document.fonts.ready){
      document.fonts.ready.then(()=>requestAnimationFrame(startMarquee));
    }else{
      requestAnimationFrame(startMarquee);
    }
  }
}
