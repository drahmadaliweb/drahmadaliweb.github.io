
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
