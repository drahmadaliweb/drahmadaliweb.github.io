(() => {
  const input=document.getElementById('siteSearchInput');
  const out=document.getElementById('siteSearchResults');
  const status=document.getElementById('siteSearchStatus');
  if(!input||!out) return;
  const isBn=document.documentElement.lang==='bn';
  const lang=isBn?'bn':'en';
  const copy=isBn?{start:'খুঁজতে শব্দ লিখুন।',none:'কোনো ফল পাওয়া যায়নি।',results:'টি ফল',book:'গ্রন্থ',writing:'লেখা',update:'আপডেট',publication:'গবেষণা প্রকাশনা',page:'পৃষ্ঠা',profile:'প্রোফাইল'}:{start:'Type a word or phrase to search.',none:'No results found.',results:'results',book:'Book',writing:'Writing',update:'Update',publication:'Publication',page:'Page',profile:'Profile'};
  const entries=[];
  const topicTaxonomy=window.ahmadAliTopicTaxonomy||{};
  const topicKeywords=slug=>{const t=topicTaxonomy[slug]||{};return [slug,t.en,t.bn];};
  const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
  const strip=s=>String(s||'').replace(/\s+/g,' ').trim();
  const add=e=>{if(e&&e.title&&e.href)entries.push({...e,hay:normalize(`${e.title} ${e.summary||''} ${(e.keywords||[]).join(' ')}`)});};
  const base=isBn?'':'', page=(name)=>name;

  // Rich book details.
  (window.ahmadAliBookDetails||[]).forEach(b=>{
    const l=b[lang]||b.en||b.bn||{};
    add({type:copy.book,title:l.title||b.bn?.title,summary:l.subtitle||l.summary||'',href:`books/${encodeURIComponent(b.id)}.html`,keywords:[b.category,b.en?.title,b.bn?.title,b.en?.summary,b.bn?.summary]});
  });
  // Writings.
  const slugify=text=>String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u0980-\u09ff]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
  (window.windowOfTimePosts||[]).forEach((p,i)=>{
    const l=p[lang]||p.en||p.bn||{};const id=p.id||`${p.date||'undated'}-${slugify(p.en?.title||p.bn?.title||`post-${i+1}`)||`post-${i+1}`}`;
    add({type:copy.writing,title:l.title||'',summary:strip(l.excerpt||String(l.body||'').slice(0,220)),href:`writings/${encodeURIComponent(id)}.html`,keywords:[p.source?.type,p.source?.label,...topicKeywords(p.topic_slug),p.en?.title,p.bn?.title,p.en?.body,p.bn?.body]});
  });

  // Selected Articles.
  (window.ahmadAliSelectedArticles||[]).forEach(a=>{
    const l=a[lang]||a.en||a.bn||{};
    add({type:isBn?'প্রবন্ধ':'Article',title:l.title||'',summary:strip(l.excerpt||String(l.body||'').slice(0,220)),href:`articles/${encodeURIComponent(a.id)}.html`,keywords:[...topicKeywords(a.topic_slug),a.source?.labelEn,a.source?.labelBn,a.en?.title,a.bn?.title,a.en?.body,a.bn?.body]});
  });
  // Publications.
  (window.ahmadAliPublications||[]).forEach(p=>{
    const title=isBn?(p.titleBn||p.titleEn||p.titleAr):(p.titleEn||p.titleAr||p.titleBn);
    const source=isBn?(p.sourceBn||p.sourceEn||p.sourceAr):(p.sourceEn||p.sourceAr||p.sourceBn);
    const details=isBn?(p.detailsBn||p.detailsEn):(p.detailsEn||p.detailsBn);
    add({type:copy.publication,title:title||'',summary:[source,details].filter(Boolean).join(' · '),href:`publications.html#${encodeURIComponent(p.id)}`,keywords:[p.titleEn,p.titleBn,p.titleAr,p.sourceEn,p.sourceBn,p.sourceAr,p.publisherEn,p.publisherBn,p.volume,p.issue,p.pages]});
  });
  // Updates.
  (window.ahmadAliUpdates||[]).forEach(u=>{const l=u[lang]||u.en||u.bn||{};add({type:copy.update,title:l.title||'',summary:l.summary||'',href:u.href||'updates.html',keywords:[u.date,u.en?.title,u.bn?.title]});});
  // Key static pages.
  const staticPages=isBn?[
    ['প্রোফাইল','শিক্ষা, গবেষণাক্ষেত্র, চলমান প্রকল্প, তত্ত্বাবধান ও একাডেমিক সেবা।','about.html'],
    ['জীবনী','ড. আহমদ আলীর জীবন, শিক্ষা, শিক্ষকতা, গবেষণা ও প্রকাশনার বর্ণনামূলক জীবনী।','biography.html'],
    ['গ্রন্থসমূহ','সমন্বিত গ্রন্থপঞ্জি, গ্রন্থমালা ও গ্রন্থের বিস্তারিত পাতা।','books.html'],
    ['গবেষণা প্রকাশনা','বাংলা ও আরবি গবেষণা প্রবন্ধ, সম্পাদিত ও অনূদিত কাজ।','publications.html'],
    ['প্রবন্ধ সংকলন','গবেষণা-প্রকাশনার বাইরে নির্বাচিত প্রবন্ধ ও সাধারণ রচনা।','selected-articles.html'],
    ['সময়ের সঙ্গে সংলাপ','প্রবন্ধ, ভাবনা, ফেসবুক পোস্ট, সংবাদপত্র ও সাময়িকীর লেখা।','window-of-time.html']
  ]:[
    ['Profile','Education, research areas, current projects, supervision and academic service.','about.html'],
    ['Biography','Narrative biography covering education, teaching, research and publishing.','biography.html'],
    ['Books','Unified bibliography, major series and book detail pages.','books.html'],
    ['Publications','Bengali and Arabic research publications, edited and translated work.','publications.html'],
    ['Selected Articles','Selected essays and general articles outside the formal research-publication record.','selected-articles.html'],
    ['Through the Window of Time','Essays, reflections, Facebook posts, newspaper and magazine writings.','window-of-time.html']
  ];
  staticPages.forEach(([title,summary,href])=>add({type:copy.page,title,summary,href}));

  // Publications are fetched below; all books are already indexed from books-manifest.js.
  async function enrich(){
    try{
      const [bookText,pubText]=await Promise.all([fetch('books.html').then(r=>r.text()),fetch('publications.html').then(r=>r.text())]);
      const bp=new DOMParser().parseFromString(bookText,'text/html');
      bp.querySelectorAll('.book-card').forEach(card=>{
        const title=card.dataset.title||card.querySelector('h3')?.textContent||'';
        const cover=card.querySelector('.book-cover'); const m=(cover?.getAttribute('href')||'').match(/\/book\/(\d+)/);
        const rich=m&&(window.ahmadAliBookDetails||[]).some(b=>String(b.rokomariId)===m[1]); if(rich)return;
        add({type:copy.book,title,summary:card.dataset.category||'',href:`books.html?q=${encodeURIComponent(title)}#bookGrid`,keywords:[card.dataset.category]});
      });
      bp.querySelectorAll('.archive-row').forEach(row=>{const title=row.querySelector('h3')?.textContent||'';if(title)add({type:copy.book,title,summary:row.querySelector('p')?.textContent||'',href:`books.html?q=${encodeURIComponent(title)}#bookGrid`});});
      const pp=new DOMParser().parseFromString(pubText,'text/html');
      pp.querySelectorAll('.publication-list article').forEach((a,i)=>{const title=a.querySelector('h3')?.textContent||'';const summary=a.querySelector('p')?.textContent||'';if(title)add({type:copy.publication,title,summary,href:`publications.html#publication-${i+1}`});});
    }catch(_e){}
    run();
  }

  function score(e,q,tokens){let s=0;const title=normalize(e.title);if(title.includes(q))s+=20;if(e.hay.includes(q))s+=10;tokens.forEach(t=>{if(title.includes(t))s+=5;if(e.hay.includes(t))s+=1;});return s;}
  function run(){
    const raw=input.value.trim();const q=normalize(raw);out.replaceChildren();
    if(!q){status.textContent=copy.start;return;}
    const tokens=q.split(' ').filter(Boolean);
    const results=entries.map(e=>({e,s:score(e,q,tokens)})).filter(x=>x.s>0&&tokens.every(t=>x.e.hay.includes(t))).sort((a,b)=>b.s-a.s||a.e.title.localeCompare(b.e.title)).slice(0,40);
    status.textContent=results.length?`${results.length} ${copy.results}`:copy.none;
    results.forEach(({e})=>{
      const a=document.createElement('a');a.className='site-search-result';a.href=e.href;
      const meta=document.createElement('span');meta.className='search-result-type';meta.textContent=e.type;
      const h=document.createElement('h2');h.textContent=e.title;
      const p=document.createElement('p');p.textContent=e.summary||'';
      const arrow=document.createElement('span');arrow.className='search-result-arrow';arrow.textContent='→';
      a.append(meta,h,p,arrow);out.appendChild(a);
    });
  }
  input.addEventListener('input',run);
  const initial=new URLSearchParams(location.search).get('q');if(initial){input.value=initial;document.querySelectorAll('.language-switch a').forEach(a=>{const h=a.getAttribute('href');if(h)a.setAttribute('href',`${h}?q=${encodeURIComponent(initial)}`);});}
  enrich();
})();
