
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

/* Latest updates ticker
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
  const link=ticker.querySelector('.update-link');
  let updateIndex=0;
  let tickerTimer;
  const renderUpdate=(index,animate=true)=>{
    if(!link||!items.length)return;
    const item=items[index%items.length];
    link.textContent=item.text+'  →';
    link.href=item.href;
    if(animate){
      link.classList.remove('is-changing');
      void link.offsetWidth;
      link.classList.add('is-changing');
    }
  };
  const startTicker=()=>{
    if(items.length<2||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    clearInterval(tickerTimer);
    tickerTimer=setInterval(()=>{updateIndex=(updateIndex+1)%items.length;renderUpdate(updateIndex,true);},5500);
  };
  renderUpdate(0,false);
  startTicker();
  ticker.addEventListener('mouseenter',()=>clearInterval(tickerTimer));
  ticker.addEventListener('mouseleave',startTicker);
  ticker.addEventListener('focusin',()=>clearInterval(tickerTimer));
  ticker.addEventListener('focusout',startTicker);
}

