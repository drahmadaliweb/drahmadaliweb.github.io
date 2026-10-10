/* Selected Articles: archive + full-article rendering. */
(() => {
  const items = Array.isArray(window.ahmadAliSelectedArticles) ? [...window.ahmadAliSelectedArticles] : [];
  const topicTaxonomy = window.ahmadAliTopicTaxonomy || {};
  const isBn = document.documentElement.lang === 'bn';
  const lang = isBn ? 'bn' : 'en';
  const locale = isBn ? 'bn-BD' : 'en-GB';
  const copy = isBn ? {
    read:'পুরো প্রবন্ধ পড়ুন', back:'সব প্রবন্ধ দেখুন', pending:'সম্পূর্ণ প্রবন্ধের পাঠ্য এখনো আর্কাইভে যোগ করা হয়নি।',
    missing:'প্রবন্ধটি পাওয়া যায়নি।', topic:'বিষয়', source:'উৎস', allTopics:'সব বিষয়', noMatch:'আপনার খোঁজ বা নির্বাচিত বিষয়ের সঙ্গে মিলেছে এমন কোনো প্রবন্ধ পাওয়া যায়নি।'
  } : {
    read:'Read full article', back:'Back to all articles', pending:'The complete article text has not yet been added to the archive.',
    missing:'This article could not be found.', topic:'Topic', source:'Source', allTopics:'All topics', noMatch:'No articles matched your search or selected topic.'
  };
  const localized=a=>a?.[lang]||a?.bn||a?.en||{};
  const sourceLabel=a=>isBn?(a?.source?.labelBn||a?.source?.labelEn):(a?.source?.labelEn||a?.source?.labelBn);
  const topicLabel=a=>{const t=topicTaxonomy[a?.topic_slug]||{};return isBn?(t.bn||t.en||''):(t.en||t.bn||'');};
  const hasBody=a=>Boolean(String(localized(a).body||'').trim());
  const dateLabel=a=>{
    const l=localized(a); if(l.dateLabel) return l.dateLabel;
    const d=new Date(`${a.date||''}T12:00:00`); return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',day:'numeric'}).format(d);
  };
  const clean=s=>String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).filter(x=>!/^\*{3}(?:\s+\*{3})+$/u.test(x)&&!/^<{3}.*>{3}$/u.test(x)).map(x=>x.replace(/^#\s*/u,'')).join(' ').replace(/\s+/g,' ').trim();
  const excerpt=(s,max=300)=>{const t=clean(s); if(t.length<=max)return t; const c=t.slice(0,max); const i=Math.max(c.lastIndexOf('।'),c.lastIndexOf('.'),c.lastIndexOf(' '));return `${c.slice(0,i>170?i:max).trim()}…`;};
  const detailHref=a=>`articles/${encodeURIComponent(a.id)}.html`;
  function renderBody(host,body){host.replaceChildren();String(body||'').split(/\r?\n/).forEach(raw=>{const line=raw.trim();if(!line)return;if(/^\*{3}(?:\s+\*{3})+$/u.test(line)||/^<{3}.*>{3}$/u.test(line)){const d=document.createElement('div');d.className='post-divider';d.setAttribute('aria-hidden','true');host.appendChild(d);return;}if(/^(?:\d+|[০-৯]+)\.\s+/u.test(line)){const h=document.createElement('h3');h.textContent=line;host.appendChild(h);return;}if(/^#\s*/u.test(line)){const p=document.createElement('p');p.className='post-question';p.textContent=line.replace(/^#\s*/u,'');host.appendChild(p);return;}const p=document.createElement('p');p.textContent=line;host.appendChild(p);});}
  items.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));

  const list=document.getElementById('selectedArticlesList');
  const topicFilter=document.getElementById('selectedArticleTopicFilter');
  const searchInput=document.getElementById('selectedArticleSearch');
  let activeTopic='all';
  let searchQuery='';
  const normalizeSearch=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const matchesSearch=a=>{
    const q=normalizeSearch(searchQuery);
    if(!q) return true;
    const l=localized(a);
    const hay=normalizeSearch([l.title,l.excerpt,l.body].filter(Boolean).join(' '));
    return q.split(/\s+/).filter(Boolean).every(token=>hay.includes(token));
  };
  const presentTopicSlugs=[...new Set(items.map(a=>a.topic_slug).filter(slug=>topicTaxonomy[slug]))];
  if(searchInput){
    searchInput.addEventListener('input',()=>{searchQuery=searchInput.value||'';renderList();});
  }
  if(topicFilter){
    topicFilter.replaceChildren();
    const allOpt=document.createElement('option');allOpt.value='all';allOpt.textContent=copy.allTopics;topicFilter.appendChild(allOpt);
    presentTopicSlugs.forEach(slug=>{const opt=document.createElement('option');opt.value=slug;const t=topicTaxonomy[slug]||{};opt.textContent=isBn?(t.bn||t.en):(t.en||t.bn);topicFilter.appendChild(opt);});
    topicFilter.addEventListener('change',()=>{activeTopic=topicFilter.value||'all';renderList();});
  }
  function renderList(){
    if(!list)return;
    const shown=items.filter(a=>(activeTopic==='all'||a.topic_slug===activeTopic)&&matchesSearch(a));
    if(!shown.length){list.innerHTML=`<div class="selected-articles-empty"><p>${copy.noMatch}</p></div>`;return;}
    list.replaceChildren(...shown.map(a=>{
      const l=localized(a), row=document.createElement('article');row.className='selected-article-row';
      const date=document.createElement('div');date.className='selected-article-date';date.textContent=dateLabel(a);
      const main=document.createElement('div');
      const meta=document.createElement('div');meta.className='selected-article-meta';
      const topic=document.createElement('span');topic.className='content-topic-chip';topic.textContent=topicLabel(a);meta.appendChild(topic);
      const src=sourceLabel(a);if(src){const ss=document.createElement('span');ss.className='selected-article-source-inline';ss.textContent=src;meta.appendChild(ss);}
      const h=document.createElement('h2');h.textContent=l.title||'';
      const ex=document.createElement('p');ex.textContent=l.excerpt||excerpt(l.body)||(copy.pending);
      main.append(meta,h,ex);
      if(hasBody(a)){const link=document.createElement('a');link.className='inline-arrow selected-article-read';link.href=detailHref(a);link.textContent=`${copy.read} →`;main.appendChild(link);}else{const pending=document.createElement('span');pending.className='article-text-pending';pending.textContent=copy.pending;main.appendChild(pending);}
      row.append(date,main);return row;
    }));
  }
  if(list)renderList();

  const detail=document.getElementById('selectedArticleDetail');
  if(detail){
    const staticId=document.querySelector('meta[name="content-id"]')?.content||'';const id=staticId||new URLSearchParams(location.search).get('id');const a=items.find(x=>x.id===id);
    if(!a){detail.replaceChildren();const p=document.createElement('p');p.className='page-lead';p.textContent=copy.missing;const back=document.createElement('a');back.className='inline-arrow';back.href='selected-articles.html';back.textContent=`← ${copy.back}`;detail.append(p,back);return;}
    const l=localized(a);const title=document.getElementById('selectedArticleTitle');const date=document.getElementById('selectedArticleDate');const topic=document.getElementById('selectedArticleTopic');const source=document.getElementById('selectedArticleSource');const body=document.getElementById('selectedArticleBody');
    if(title)title.textContent=l.title||'';if(date){date.dateTime=a.date||'';date.textContent=dateLabel(a);}if(topic){topic.textContent=topicLabel(a);topic.hidden=!topic.textContent;}if(source){source.textContent=sourceLabel(a)||'';source.hidden=!source.textContent;}
    if(body){if(hasBody(a))renderBody(body,l.body);else{body.replaceChildren();const p=document.createElement('p');p.className='article-fulltext-pending';p.textContent=copy.pending;body.appendChild(p);}}
    document.title=`${l.title||'Article'} | ${isBn?'ড. আহমদ আলী':'Dr. Ahmad Ali'}`;const desc=document.querySelector('meta[name="description"]');if(desc)desc.content=l.excerpt||excerpt(l.body,155)||l.title||'';
    if(!staticId)document.querySelectorAll('.language-switch a').forEach(link=>{const h=link.getAttribute('href');if(h)link.setAttribute('href',`${h}?id=${encodeURIComponent(a.id)}`);});
  }
})();
