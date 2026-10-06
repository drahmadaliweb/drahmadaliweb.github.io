(() => {
  const allBooks=Array.isArray(window.ahmadAliBookDetails)?window.ahmadAliBookDetails.slice():[];
  const isBn=document.documentElement.lang==='bn';
  const lang=isBn?'bn':'en';
  const prefix=isBn?'../':'';
  const asset=url=>!url?url:(/^(?:https?:)?\/\//i.test(url)||url.startsWith('data:')||url.startsWith('mailto:')||url.startsWith('#'))?url:`${prefix}${url}`;
  const detailHref=id=>`book.html?id=${encodeURIComponent(id)}`;
  const byRokomari=new Map(allBooks.filter(b=>b.rokomariId).map(b=>[String(b.rokomariId),b]));

  const categoryBn={
    'Aqidah & Thought':'আকীদা ও চিন্তাধারা',
    'Fiqh & Law':'ফিকহ ও আইন',
    'Qur’an & Tafsir':'কুরআন ও তাফসীর',
    'Qur’an & Hadith':'কুরআন ও হাদীস',
    'Islamic Thought':'ইসলামী চিন্তাধারা',
    'Islamic Ethics & Society':'ইসলামী নৈতিকতা ও সমাজ',
    'Governance & Society':'শাসনব্যবস্থা ও সমাজ',
    'Sirah & Biography':'সীরাত ও জীবনী',
    'Spirituality':'আত্মশুদ্ধি ও আধ্যাত্মিকতা',
    'Arabic Language & Literature':'আরবি ভাষা ও সাহিত্য'
  };
  const categoryName=value=>isBn?(categoryBn[value]||value):value;

  const copy=isBn?{
    all:'সব',details:'বিস্তারিত দেখুন',preview:'প্রিভিউ',pdf:'PDF',audio:'অডিওবুক',rokomari:'রকমারি',publisherLink:'প্রকাশক',order:'অর্ডার করুন',
    back:'সব গ্রন্থে ফিরুন',about:'গ্রন্থ পরিচিতি',information:'প্রকাশনা তথ্য',publisher:'প্রকাশক',isbn:'ISBN',edition:'সংস্করণ',pages:'পৃষ্ঠা',binding:'বাঁধাই',country:'দেশ',language:'ভাষা',category:'বিষয়',
    listen:'অডিওবুক',readPdf:'PDF পড়ুন',openPreview:'প্রিভিউ দেখুন',missing:'গ্রন্থের বিস্তারিত তথ্য পাওয়া যায়নি।',forthcoming:'প্রকাশিতব্য',ongoing:'চলমান',
    catalog:'গ্রন্থ তালিকা',catalogNote:'বিষয় অনুসারে প্রকাশিত গ্রন্থসমূহ দেখুন।',noMatch:'কোনো মিলযুক্ত গ্রন্থ পাওয়া যায়নি।',external:'বাহ্যিক লিংক'
  }:{
    all:'All',details:'View Details',preview:'Preview',pdf:'PDF',audio:'Audiobook',rokomari:'Rokomari',publisherLink:'Publisher',order:'Order Here',
    back:'Back to all books',about:'About this book',information:'Publication information',publisher:'Publisher',isbn:'ISBN',edition:'Edition',pages:'Pages',binding:'Binding',country:'Country',language:'Language',category:'Category',
    listen:'Audiobook',readPdf:'Read PDF',openPreview:'Preview',missing:'Detailed information for this book is not available.',forthcoming:'Forthcoming',ongoing:'Ongoing',
    catalog:'Book catalog',catalogNote:'Browse published works by topic.',noMatch:'No matching books found.',external:'External links'
  };

  const series=[
    {
      id:'bidat',
      en:{title:'Bid‘ah',note:'Eight-volume research project; the eighth volume is published in two parts as Modern Currents of Thought and Ideologies.'},
      bn:{title:'বিদ‘আত',note:'আট খণ্ডের গবেষণা প্রকল্প; অষ্টম খণ্ডটি “আধুনিক চিন্তাধারা ও মতবাদ” নামে দুই ভাগে প্রকাশিত।'},
      volumes:[['1','186396'],['2','186398'],['3','194779'],['4','206454'],['5','214109'],['6','234608'],['7','273066'],['8 · I','509331'],['8 · II','511409']]
    },
    {
      id:'usulul-iman',
      en:{title:'Usul al-Iman',note:'A multi-volume treatment of the foundations of faith; Volumes 5 and 6 are forthcoming.'},
      bn:{title:'উসূলুল ঈমান',note:'ঈমানের মৌলিক বিষয়াবলি নিয়ে বহু-খণ্ডের গ্রন্থমালা; ৫ম ও ৬ষ্ঠ খণ্ড প্রকাশের পথে।'},
      volumes:[['1','305722'],['2','305723'],['3','394655'],['4','394656'],['5',null,'forthcoming','usulul-iman-vol-5'],['6',null,'forthcoming','usulul-iman-vol-6']]
    },
    {
      id:'zubdatul-bayan',
      en:{title:'Zubdat al-Bayan',note:'An ongoing Bengali tafsir project intended to develop into a complete commentary on the Qur’an.'},
      bn:{title:'যুবদাতুল বায়ান',note:'পূর্ণাঙ্গ বাংলা কুরআন তাফসির হিসেবে বিকাশমান একটি চলমান তাফসির প্রকল্প।'},
      volumes:[['1','204536'],['2','234566'],['…',null,'ongoing']]
    }
  ];

  function renderSeries(){
    const host=document.getElementById('bookSeries');
    if(!host)return;
    host.replaceChildren();
    series.forEach(s=>{
      const loc=s[lang];
      const card=document.createElement('article');card.className='series-card';
      const head=document.createElement('div');head.className='series-card-head';
      const h=document.createElement('h3');h.textContent=loc.title;
      const p=document.createElement('p');p.textContent=loc.note;
      head.append(h,p);
      const vols=document.createElement('div');vols.className='series-volume-row';
      s.volumes.forEach(([label,rid,status,id])=>{
        if(status){
          const el=id?document.createElement('a'):document.createElement('span');
          el.className='series-volume muted';
          if(id)el.href=detailHref(id);
          el.textContent=`${label} · ${status==='ongoing'?copy.ongoing:copy.forthcoming}`;
          vols.appendChild(el);return;
        }
        const book=byRokomari.get(String(rid));
        if(!book)return;
        const a=document.createElement('a');a.className='series-volume';a.href=detailHref(book.id);a.textContent=label;vols.appendChild(a);
      });
      card.append(head,vols);host.appendChild(card);
    });
  }

  function localized(book){return book?.[lang]||book?.en||book?.bn||{};}
  function coverTitle(book){return book?.bn?.title||localized(book).title||'';}

  function makeBookCard(book){
    const loc=localized(book);
    const article=document.createElement('article');
    article.className='book-card reveal';
    article.dataset.category=book.category||'';
    article.dataset.title=String(`${loc.title||''} ${book.bn?.title||''} ${book.en?.title||''}`).toLowerCase();

    const a=document.createElement('a');a.className='book-cover';a.href=detailHref(book.id);a.setAttribute('aria-label',`${copy.details}: ${loc.title||coverTitle(book)}`);
    const media=book.media||{};
    if(media.cover){
      a.classList.add('has-real-cover');
      const img=document.createElement('img');img.className='book-cover-image';img.src=asset(media.cover);img.alt=loc.title||coverTitle(book);a.appendChild(img);
    }else{
      const seriesLabel=document.createElement('span');seriesLabel.className='book-series';seriesLabel.textContent=categoryName(book.category||'');
      const glyph=document.createElement('span');glyph.className='book-glyph';glyph.setAttribute('aria-hidden','true');glyph.textContent='۞';
      const h=document.createElement('h3');h.lang='bn';h.textContent=coverTitle(book);
      const author=document.createElement('span');author.className='book-author';author.lang='bn';author.textContent='ড. আহমদ আলী';
      a.append(seriesLabel,glyph,h,author);
    }
    const overlay=document.createElement('span');overlay.className='book-hover-overlay';
    const button=document.createElement('span');button.className='book-hover-action';button.textContent=copy.details;
    overlay.appendChild(button);a.appendChild(overlay);
    article.appendChild(a);
    return article;
  }

  const banglaCollator=new Intl.Collator('bn-BD',{sensitivity:'base',numeric:true,ignorePunctuation:true});
  const banglaTitle=book=>String(book?.bn?.title||book?.en?.originalTitle||book?.en?.title||'').trim();
  const compareByBanglaTitle=(a,b)=>banglaCollator.compare(banglaTitle(a),banglaTitle(b));

  function renderCatalog(){
    const host=document.getElementById('bookGrid');
    if(!host)return;
    // Canonical catalog order is Bengali alphabetical order on BOTH language versions.
    const published=allBooks.filter(b=>(b.status||'published')==='published').sort(compareByBanglaTitle);
    host.replaceChildren(...published.map(makeBookCard));

    const filters=document.getElementById('bookFilters');
    if(filters){
      filters.replaceChildren();
      const cats=[...new Set(published.map(b=>b.category).filter(Boolean))];
      const values=['All',...cats];
      values.forEach((value,i)=>{
        const btn=document.createElement('button');btn.className=`filter-btn${i===0?' active':''}`;btn.dataset.filter=value;btn.textContent=value==='All'?copy.all:categoryName(value);filters.appendChild(btn);
      });
    }
    const note=document.getElementById('bookCatalogNote');if(note)note.textContent=copy.catalogNote;
    const title=document.getElementById('bookCatalogTitle');if(title)title.textContent=copy.catalog;
    const empty=document.getElementById('bookEmpty');if(empty)empty.textContent=copy.noMatch;
  }

  function renderForthcoming(){
    const host=document.getElementById('bookForthcoming');if(!host)return;
    const items=allBooks.filter(b=>b.status==='forthcoming').sort(compareByBanglaTitle);
    host.replaceChildren();
    items.forEach(book=>{
      const a=document.createElement('a');a.className='archive-row forthcoming-row';a.href=detailHref(book.id);
      const h=document.createElement('h3');h.lang='bn';h.textContent=book.bn?.title||localized(book).title||'';
      const p=document.createElement('p');p.textContent=copy.forthcoming;
      a.append(h,p);host.appendChild(a);
    });
  }

  function renderDetail(){
    const host=document.getElementById('bookDetail');if(!host)return;
    const id=new URLSearchParams(location.search).get('id');
    const book=allBooks.find(b=>b.id===id);
    if(!book){host.innerHTML=`<p class="page-lead">${copy.missing}</p><a class="inline-arrow" href="books.html">← ${copy.back}</a>`;return;}
    const loc=localized(book);const title=loc.title||book.bn?.title||'';const subtitle=loc.subtitle||'';
    document.title=`${title} | ${isBn?'ড. আহমদ আলী':'Dr. Ahmad Ali'}`;
    const desc=document.querySelector('meta[name="description"]');if(desc)desc.content=loc.summary||subtitle||title;
    const titleEl=document.getElementById('bookDetailTitle');if(titleEl)titleEl.textContent=title;
    const sub=document.getElementById('bookDetailSubtitle');if(sub){sub.textContent=subtitle;sub.hidden=!subtitle;}
    const cover=document.querySelector('.detail-book-cover');
    const coverTitleEl=document.getElementById('detailCoverTitle');if(coverTitleEl)coverTitleEl.textContent=book.bn?.title||title;
    const coverSeries=document.getElementById('detailCoverSeries');if(coverSeries)coverSeries.textContent=categoryName(book.category||'');
    if(cover&&book.media?.cover){cover.classList.add('has-real-cover');cover.style.backgroundImage=`url(${JSON.stringify(asset(book.media.cover)).slice(1,-1)})`;}
    const summary=document.getElementById('bookDetailSummary');if(summary)summary.textContent=loc.summary||'';
    const summarySection=summary?.closest('.book-summary');if(summarySection)summarySection.hidden=!loc.summary;

    const actions=document.getElementById('bookDetailActions');
    if(actions){
      actions.replaceChildren();
      const m=book.media||{};
      if(m.preview){const a=document.createElement('a');a.className='btn secondary';a.href=asset(m.preview);a.target='_blank';a.rel='noopener';a.textContent=copy.openPreview;actions.appendChild(a);}
      if(m.pdf){const a=document.createElement('a');a.className='btn secondary';a.href=asset(m.pdf);a.target='_blank';a.rel='noopener';a.textContent=copy.readPdf;actions.appendChild(a);}
      if(Array.isArray(m.audio)&&m.audio.some(t=>t?.url)){const a=document.createElement('a');a.className='btn secondary';a.href='#audio';a.textContent=copy.listen;actions.appendChild(a);}
      const publisherLink=Array.isArray(book.links)?book.links.find(x=>x?.url&&/^publisher(?:\s+catalog)?$/i.test(String(x.label||''))):null;
      if(publisherLink){const a=document.createElement('a');a.className='btn quiet';a.href=publisherLink.url;a.target='_blank';a.rel='noopener';a.textContent=`${copy.publisherLink} ↗`;actions.appendChild(a);}
      if(book.rokomariUrl){const a=document.createElement('a');a.className='btn quiet';a.href=book.rokomariUrl;a.target='_blank';a.rel='noopener';a.textContent=`${copy.rokomari} ↗`;actions.appendChild(a);}
      const order=document.createElement('a');order.className='btn primary';order.href=`contact.html?subject=book-order&bookId=${encodeURIComponent(book.id)}#inquiry-form`;order.textContent=copy.order;actions.appendChild(order);
      actions.hidden=!actions.children.length;
    }

    const specs=document.getElementById('bookSpecs');
    if(specs){
      const m=book.meta||{};
      const rows=[
        [copy.publisher,isBn?(m.publisherBn||m.publisher):m.publisher],
        [copy.isbn,m.isbn],
        [copy.edition,isBn?(m.editionBn||m.edition):m.edition],
        [copy.pages,m.pages],
        [copy.binding,isBn?(m.bindingBn||m.binding):m.binding],
        [copy.country,isBn?(m.countryBn||m.country):m.country],
        [copy.language,isBn?(m.languageBn||m.language):m.language],
        [copy.category,categoryName(book.category)]
      ].filter(([,v])=>v);
      specs.replaceChildren();rows.forEach(([k,v])=>{const row=document.createElement('div');const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;row.append(dt,dd);specs.appendChild(row);});
      const panel=specs.closest('.book-spec-panel');if(panel)panel.hidden=!rows.length;
    }

    const media=document.getElementById('bookMedia');
    if(media){
      const m=book.media||{};const has=Boolean(m.preview||m.pdf||(Array.isArray(m.audio)&&m.audio.some(t=>t?.url)));
      media.hidden=!has;
      if(has){
        const audioHost=document.getElementById('bookAudio');if(audioHost){audioHost.replaceChildren();(m.audio||[]).filter(t=>t?.url).forEach((track,i)=>{
          const item=document.createElement('div');item.className='audio-track';
          const label=document.createElement('strong');label.textContent=(isBn?(track.titleBn||track.title):track.title)||`${copy.audio} ${i+1}`;
          const player=document.createElement('audio');player.controls=true;player.preload='none';player.src=asset(track.url);item.append(label,player);audioHost.appendChild(item);
        });}
      }
    }
    document.querySelectorAll('.language-switch a').forEach(a=>{const href=a.getAttribute('href');if(href)a.setAttribute('href',`${href}?id=${encodeURIComponent(book.id)}`);});
  }

  renderSeries();renderCatalog();renderForthcoming();renderDetail();
})();
