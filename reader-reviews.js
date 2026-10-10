(() => {
  const wall=document.getElementById('readerReviewWall');
  if(!wall)return;

  const isBn=document.documentElement.lang==='bn';
  const config=window.AHMAD_ALI_REVIEW_CONFIG||{};
  const supabaseUrl=String(config.supabaseUrl||'').replace(/\/$/,'');
  const key=String(config.publishableKey||config.anonKey||'').trim();
  const configured=Boolean(supabaseUrl&&key);
  const books=Array.isArray(window.ahmadAliBookDetails)?window.ahmadAliBookDetails.slice():[];
  const publishedBooks=books.filter(b=>(b.status||'published')==='published');
  const bookById=new Map(books.map(b=>[String(b.id),b]));

  const copy=isBn?{
    add:'মতামত দিন',close:'ফর্ম বন্ধ করুন',generalFeedback:'সাধারণ মতামত',selectBook:'একটি গ্রন্থ নির্বাচন করুন',selectLanguage:'ভাষা নির্বাচন করুন',langBn:'বাংলা',langEn:'ইংরেজি',langBoth:'বাংলা ও ইংরেজি উভয় ভাষায়',
    consentBn:'আমি সম্মতি দিচ্ছি যে, এই বাংলা রিভিউটি ওয়েবসাইটের ইংরেজি সংস্করণে প্রদর্শনের জন্য AI ব্যবহার করে ইংরেজিতে অনুবাদ করা হতে পারে।',
    consentEn:'আমি সম্মতি দিচ্ছি যে, এই ইংরেজি রিভিউটি ওয়েবসাইটের বাংলা সংস্করণে প্রদর্শনের জন্য AI ব্যবহার করে বাংলায় অনুবাদ করা হতে পারে।',
    required:'নাম, গ্রন্থ, রিভিউয়ের ভাষা এবং প্রয়োজনীয় রিভিউ লিখুন।',
    consentRequired:'AI অনুবাদের সম্মতিতে টিক দিন, অথবা উভয় ভাষায় রিভিউ দিন।',
    email:'সঠিক ইমেইল ঠিকানা লিখুন অথবা ইমেইল ঘরটি খালি রাখুন।',
    submitting:'রিভিউ জমা দেওয়া হচ্ছে…',
    submitted:'ধন্যবাদ। আপনার রিভিউটি পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের পর নির্বাচিত গ্রন্থের পাতায় প্রকাশিত হবে; ৪০ শব্দ বা তার বেশি হলে এই পাতাতেও দেখানো হতে পারে।',
    unavailable:'রিভিউ জমা দেওয়ার সেবা এখনো সম্পূর্ণভাবে চালু হয়নি।',
    translationUnavailable:'AI অনুবাদ সেবা এখনো সক্রিয় নয়। আপাতত উভয় ভাষায় রিভিউ দিন অথবা পরে আবার চেষ্টা করুন।',
    error:'রিভিউ জমা দেওয়া যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
    loading:'পাঠকের রিভিউ লোড হচ্ছে…',
    none:'৪০ শব্দ বা তার বেশি কোনো অনুমোদিত রিভিউ এখনো পাওয়া যায়নি।',
    seeMore:'পুরোটা পড়ুন',seeLess:'সংক্ষেপে দেখুন',
    count:n=>`${new Intl.NumberFormat('bn-BD').format(n)}টি রিভিউ`,
    date:d=>new Intl.DateTimeFormat('bn-BD',{day:'numeric',month:'long',year:'numeric'}).format(d),
    source:{
      rokomari:'মূলত Rokomari-তে প্রকাশিত',facebook:'মূলত Facebook-এ প্রকাশিত',
      bdbooks:'মূলত BDBOOKS-এ প্রকাশিত',goodreads:'মূলত Goodreads-এ প্রকাশিত',
      iqaamah:'মূলত Iqaamah Blog-এ প্রকাশিত',website:'এই ওয়েবসাইটে জমা দেওয়া হয়েছে'
    }
  }:{
    add:'Add a Review',close:'Close Form',generalFeedback:'General Feedback',selectBook:'Select a book',selectLanguage:'Select language',langBn:'Bengali',langEn:'English',langBoth:'Both Bengali and English',
    consentBn:'I agree that this Bengali review may be translated into English using AI for display on the English version of this website.',
    consentEn:'I agree that this English review may be translated into Bengali using AI for display on the Bengali version of this website.',
    required:'Please enter your name, select a book and language, and complete the required review field(s).',
    consentRequired:'Please agree to the AI translation, or submit the review in both languages.',
    email:'Enter a valid email address, or leave the email field blank.',
    submitting:'Submitting your review…',
    submitted:'Thank you. Your review has been submitted for moderation. After approval it will appear on the selected book page; reviews of 40 words or more may also appear here.',
    unavailable:'Reader-review submission has not been fully activated yet.',
    translationUnavailable:'AI translation is not active yet. For now, submit both Bengali and English versions or try again later.',
    error:'We could not submit your review. Please try again later.',
    loading:'Loading reader reviews…',
    none:'No approved reviews of 40 words or more are available yet.',
    seeMore:'Read More',seeLess:'Show Less',
    count:n=>`${n} review${n===1?'':'s'}`,
    date:d=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(d),
    source:{
      rokomari:'Originally posted on Rokomari',facebook:'Originally posted on Facebook',
      bdbooks:'Originally posted on BDBOOKS',goodreads:'Originally posted on Goodreads',
      iqaamah:'Originally posted on Iqaamah Blog',website:'Submitted through this website'
    }
  };

  const toggle=document.getElementById('readerReviewFormToggle');
  const formPanel=document.getElementById('readerReviewFormPanel');
  const form=document.getElementById('readerReviewPageForm');
  const nameInput=document.getElementById('readerReviewName');
  const emailInput=document.getElementById('readerReviewEmail');
  const bookSelect=document.getElementById('readerReviewBook');
  const bookPicker=document.getElementById('readerReviewBookPicker');
  const bookToggle=document.getElementById('readerReviewBookToggle');
  const bookMenu=document.getElementById('readerReviewBookMenu');
  const bookLabel=document.getElementById('readerReviewBookLabel');
  const languageSelect=document.getElementById('readerReviewLanguage');
  const languagePicker=document.getElementById('readerReviewLanguagePicker');
  const languageToggle=document.getElementById('readerReviewLanguageToggle');
  const languageMenu=document.getElementById('readerReviewLanguageMenu');
  const languageLabel=document.getElementById('readerReviewLanguageLabel');
  const consentWrap=document.getElementById('readerReviewConsentWrap');
  const consentInput=document.getElementById('readerReviewAiConsent');
  const consentText=document.getElementById('readerReviewConsentText');
  const bnWrap=document.getElementById('readerReviewBnWrap');
  const enWrap=document.getElementById('readerReviewEnWrap');
  const bnInput=document.getElementById('readerReviewBn');
  const enInput=document.getElementById('readerReviewEn');
  const honeypot=document.getElementById('readerReviewWebsite');
  const submit=document.getElementById('readerReviewSubmit');
  const status=document.getElementById('readerReviewStatus');
  const count=document.getElementById('readerReviewWallCount');
  const empty=document.getElementById('readerReviewWallEmpty');

  function localBookTitle(book){
    const loc=book?.[isBn?'bn':'en']||book?.en||book?.bn||{};
    const title=String(loc.title||book?.bn?.title||book?.id||'').trim();
    const subtitle=String(loc.subtitle||'').trim();
    return subtitle?`${title}: ${subtitle}`:title;
  }
  function canonicalBookTitle(book){
    const title=String(book?.bn?.title||book?.en?.originalTitle||book?.en?.title||book?.id||'').trim();
    const subtitle=String(book?.bn?.subtitle||'').trim();
    return subtitle?`${title} : ${subtitle}`:title;
  }

  const bnCollator=new Intl.Collator('bn-BD',{sensitivity:'base',numeric:true,ignorePunctuation:true});
  publishedBooks.sort((a,b)=>bnCollator.compare(
    String(a?.bn?.title||a?.en?.originalTitle||a?.en?.title||''),
    String(b?.bn?.title||b?.en?.originalTitle||b?.en?.title||'')
  ));

  function setBookChoice(value,label){
    if(bookSelect)bookSelect.value=value||'';
    if(bookLabel)bookLabel.textContent=label||copy.selectBook;
    if(bookMenu){
      for(const option of bookMenu.querySelectorAll('.review-book-option')){
        option.setAttribute('aria-selected',String(option.dataset.value===value));
      }
    }
    if(bookMenu)bookMenu.hidden=true;
    if(bookToggle)bookToggle.setAttribute('aria-expanded','false');
  }

  function addBookOption(value,label){
    if(!bookMenu)return;
    const option=document.createElement('button');
    option.type='button';
    option.className='review-book-option';
    option.dataset.value=value;
    option.setAttribute('role','option');
    option.setAttribute('aria-selected','false');
    option.textContent=label;
    option.addEventListener('click',()=>setBookChoice(value,label));
    bookMenu.appendChild(option);
  }

  if(bookMenu&&bookSelect){
    bookMenu.replaceChildren();
    addBookOption('general-feedback',copy.generalFeedback);
    for(const book of publishedBooks)addBookOption(book.id,localBookTitle(book));
    const preselected=new URLSearchParams(location.search).get('book');
    if(preselected==='general-feedback')setBookChoice('general-feedback',copy.generalFeedback);
    else if(preselected&&bookById.has(preselected))setBookChoice(preselected,localBookTitle(bookById.get(preselected)));
  }

  bookToggle?.addEventListener('click',()=>{
    if(!bookMenu)return;
    const open=bookMenu.hidden;
    bookMenu.hidden=!open;
    bookToggle.setAttribute('aria-expanded',String(open));
    if(open)bookMenu.querySelector('.review-book-option[aria-selected="true"],.review-book-option')?.focus();
  });
  document.addEventListener('click',event=>{
    if(bookPicker&&!bookPicker.contains(event.target)){
      if(bookMenu)bookMenu.hidden=true;
      if(bookToggle)bookToggle.setAttribute('aria-expanded','false');
    }
  });
  bookMenu?.addEventListener('keydown',event=>{
    const options=[...bookMenu.querySelectorAll('.review-book-option')];
    const i=options.indexOf(document.activeElement);
    if(event.key==='ArrowDown'){event.preventDefault();options[Math.min(options.length-1,i+1)]?.focus();}
    if(event.key==='ArrowUp'){event.preventDefault();options[Math.max(0,i-1)]?.focus();}
    if(event.key==='Escape'){event.preventDefault();bookMenu.hidden=true;bookToggle?.setAttribute('aria-expanded','false');bookToggle?.focus();}
  });

  function setLanguageChoice(value,label){
    if(languageSelect)languageSelect.value=value||'';
    if(languageLabel)languageLabel.textContent=label||copy.selectLanguage;
    if(languageMenu){
      for(const option of languageMenu.querySelectorAll('.review-book-option')){
        option.setAttribute('aria-selected',String(option.dataset.value===value));
      }
    }
    if(languageMenu)languageMenu.hidden=true;
    if(languageToggle)languageToggle.setAttribute('aria-expanded','false');
    languageSelect?.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function addLanguageOption(value,label){
    if(!languageMenu)return;
    const option=document.createElement('button');
    option.type='button';
    option.className='review-book-option';
    option.dataset.value=value;
    option.setAttribute('role','option');
    option.setAttribute('aria-selected','false');
    option.textContent=label;
    option.addEventListener('click',()=>setLanguageChoice(value,label));
    languageMenu.appendChild(option);
  }

  if(languageMenu&&languageSelect){
    languageMenu.replaceChildren();
    addLanguageOption('bn',copy.langBn);
    addLanguageOption('en',copy.langEn);
    addLanguageOption('both',copy.langBoth);
  }

  languageToggle?.addEventListener('click',()=>{
    if(!languageMenu)return;
    const open=languageMenu.hidden;
    languageMenu.hidden=!open;
    languageToggle.setAttribute('aria-expanded',String(open));
    if(open)languageMenu.querySelector('.review-book-option[aria-selected="true"],.review-book-option')?.focus();
  });
  document.addEventListener('click',event=>{
    if(languagePicker&&!languagePicker.contains(event.target)){
      if(languageMenu)languageMenu.hidden=true;
      if(languageToggle)languageToggle.setAttribute('aria-expanded','false');
    }
  });
  languageMenu?.addEventListener('keydown',event=>{
    const options=[...languageMenu.querySelectorAll('.review-book-option')];
    const i=options.indexOf(document.activeElement);
    if(event.key==='ArrowDown'){event.preventDefault();options[Math.min(options.length-1,i+1)]?.focus();}
    if(event.key==='ArrowUp'){event.preventDefault();options[Math.max(0,i-1)]?.focus();}
    if(event.key==='Escape'){event.preventDefault();languageMenu.hidden=true;languageToggle?.setAttribute('aria-expanded','false');languageToggle?.focus();}
  });

  function setOpen(open){
    if(!formPanel||!toggle)return;
    formPanel.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open?copy.close:copy.add;
    if(open)setTimeout(()=>nameInput?.focus(),0);
  }
  toggle?.addEventListener('click',()=>setOpen(formPanel?.hidden!==false));

  function updateLanguageFields(){
    const lang=String(languageSelect?.value||'');
    const hasSelection=lang==='bn'||lang==='en'||lang==='both';
    const showBn=lang==='bn'||lang==='both'||(!hasSelection&&isBn);
    const showEn=lang==='en'||lang==='both'||(!hasSelection&&!isBn);
    if(bnWrap)bnWrap.hidden=!showBn;
    if(enWrap)enWrap.hidden=!showEn;
    if(bnInput)bnInput.required=hasSelection&&(lang==='bn'||lang==='both');
    if(enInput)enInput.required=hasSelection&&(lang==='en'||lang==='both');
    const needConsent=lang==='bn'||lang==='en';
    if(consentWrap)consentWrap.hidden=!needConsent;
    if(consentInput){consentInput.required=needConsent;consentInput.setAttribute('aria-required',String(needConsent));if(!needConsent)consentInput.checked=false;}
    if(consentText)consentText.textContent=lang==='bn'?copy.consentBn:lang==='en'?copy.consentEn:'';
  }
  languageSelect?.addEventListener('change',updateLanguageFields);
  updateLanguageFields();

  function setStatus(message,type=''){
    if(!status)return;
    status.textContent=message||'';
    status.className=`review-form-status${type?` ${type}`:''}`;
  }
  function apiHeaders(){return {'apikey':key,'Content-Type':'application/json'};}
  function wordCount(text){return (String(text||'').trim().match(/\S+/g)||[]).length;}
  function originalWordCount(item){
    const sourceLanguage=String(item.source_language||'');
    if(sourceLanguage==='mixed')return Math.max(wordCount(item.review),wordCount(item.review_en));
    if(item.review_original)return wordCount(item.review_original);
    if(sourceLanguage==='en')return wordCount(item.review_en||item.review);
    return wordCount(item.review||item.review_en);
  }
  function previewText(text,limit=100){
    const value=String(text||'').trim();
    const matches=[...value.matchAll(/\S+/g)];
    if(matches.length<=limit)return null;
    const last=matches[limit-1];
    const end=last.index+last[0].length;
    return `${value.slice(0,end).trimEnd()}…`;
  }
  function reviewDate(item){
    if(item.source_date){const d=new Date(`${item.source_date}T12:00:00`);return Number.isNaN(d.getTime())?null:d;}
    if(item.created_at){const d=new Date(item.created_at);return Number.isNaN(d.getTime())?null:d;}
    return null;
  }
  function sourceLabel(source){return copy.source[String(source||'')]||'';}

  function dhakaDateKey(){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }
  function hashSeed(value){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function seededRandom(seed){let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  function dailyShuffle(items){
    const out=items.slice();
    const rand=seededRandom(hashSeed(`reader-reviews:${dhakaDateKey()}`));
    for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }

  function card(item){
    const article=document.createElement('article');article.className='reader-review-wall-card';
    const itemBookId=String(item.book_id||'');
    const book=bookById.get(itemBookId);
    const h=document.createElement('h3');h.className='reader-review-card-book';
    if(itemBookId==='general-feedback')h.textContent=copy.generalFeedback;
    else{
      const bookLink=document.createElement('a');
      bookLink.href=`book.html?id=${encodeURIComponent(itemBookId)}`;
      bookLink.textContent=book?localBookTitle(book):String(item.book_title||'');
      h.appendChild(bookLink);
    }
    const reviewer=document.createElement('strong');reviewer.className='reader-review-card-name';reviewer.textContent=String(item.name||'').trim();
    article.append(h,reviewer);
    const dt=reviewDate(item);
    if(dt){const time=document.createElement('time');time.className='reader-review-card-date';time.dateTime=dt.toISOString();time.textContent=copy.date(dt);article.appendChild(time);}
    const displayed=isBn?String(item.review||item.review_en||'').trim():String(item.review_en||item.review||'').trim();
    const text=document.createElement('p');text.className='reader-review-card-text';
    const preview=previewText(displayed);const textSpan=document.createElement('span');textSpan.textContent=preview||displayed;text.appendChild(textSpan);article.appendChild(text);
    if(preview){
      const more=document.createElement('button');more.type='button';more.className='reader-review-card-more';more.textContent=copy.seeMore;more.setAttribute('aria-expanded','false');
      let expanded=false;more.addEventListener('click',()=>{expanded=!expanded;textSpan.textContent=expanded?displayed:preview;more.textContent=expanded?copy.seeLess:copy.seeMore;more.setAttribute('aria-expanded',String(expanded));});
      article.appendChild(more);
    }
    const label=sourceLabel(item.source);
    if(label){
      const source=document.createElement('div');source.className='reader-review-card-source';
      if(item.source_url&&item.source!=='website'){
        source.append(document.createTextNode(`${label} `));
        const a=document.createElement('a');a.href=String(item.source_url);a.target='_blank';a.rel='noopener';a.textContent='↗';a.setAttribute('aria-label',`${label} — open original source`);source.appendChild(a);
      }else source.textContent=label;
      article.appendChild(source);
    }
    return article;
  }

  async function loadFromAggregateRpc(){
    const response=await fetch(`${supabaseUrl}/rest/v1/rpc/get_reader_reviews`,{method:'POST',headers:apiHeaders(),body:'{}'});
    if(!response.ok)throw new Error(`aggregate-rpc-${response.status}`);
    const rows=await response.json();return Array.isArray(rows)?rows:[];
  }
  async function mapLimit(items,limit,worker){
    const results=new Array(items.length);let cursor=0;
    async function runner(){while(true){const i=cursor++;if(i>=items.length)return;results[i]=await worker(items[i],i);}}
    await Promise.all(Array.from({length:Math.min(limit,items.length)},runner));return results;
  }
  async function loadFallbackPerBook(){
    const groups=await mapLimit(publishedBooks,6,async book=>{
      try{
        const response=await fetch(`${supabaseUrl}/rest/v1/rpc/get_book_reviews`,{method:'POST',headers:apiHeaders(),body:JSON.stringify({p_book_id:book.id})});
        if(!response.ok)return [];
        const rows=await response.json();
        return (Array.isArray(rows)?rows:[]).map(item=>({...item,book_id:book.id,book_title:canonicalBookTitle(book),review_original:item.review||item.review_en||null,source_language:item.review_en?'bn':null}));
      }catch{return [];}
    });
    return groups.flat();
  }
  let wallItems=[];
  let wallColumnCount=0;
  function desiredWallColumns(){
    if(window.matchMedia('(max-width:720px)').matches)return 1;
    if(window.matchMedia('(max-width:980px)').matches)return 2;
    return 3;
  }
  function renderWall(items=wallItems){
    wallItems=items.slice();
    const columns=desiredWallColumns();
    wallColumnCount=columns;
    wall.replaceChildren();
    const hosts=Array.from({length:columns},()=>{
      const col=document.createElement('div');
      col.className='reader-review-wall-column';
      wall.appendChild(col);
      return col;
    });

    wallItems.forEach((item,index)=>{
      const node=card(item);
      if(index<columns){
        hosts[index].appendChild(node);
        return;
      }

      let target=hosts[0];
      let shortest=target.getBoundingClientRect().height;
      for(let i=1;i<hosts.length;i++){
        const height=hosts[i].getBoundingClientRect().height;
        if(height<shortest){
          shortest=height;
          target=hosts[i];
        }
      }
      target.appendChild(node);
    });
  }
  let wallResizeTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(wallResizeTimer);
    wallResizeTimer=setTimeout(()=>{
      const next=desiredWallColumns();
      if(next!==wallColumnCount&&wallItems.length)renderWall();
    },120);
  });

  async function loadReviews(){
    wall.replaceChildren();if(count)count.textContent='';if(empty){empty.textContent=copy.loading;empty.hidden=false;}
    if(!configured){if(empty)empty.textContent=copy.none;return;}
    try{
      let rows;try{rows=await loadFromAggregateRpc();}catch{rows=await loadFallbackPerBook();}
      const eligible=rows.filter(item=>originalWordCount(item)>=40);
      const shuffled=dailyShuffle(eligible);
      renderWall(shuffled);
      if(empty){empty.textContent=copy.none;empty.hidden=eligible.length>0;}
    }catch(err){console.warn('Reader review wall could not be loaded.',err);if(empty){empty.textContent=copy.none;empty.hidden=false;}}
  }

  form?.addEventListener('submit',async event=>{
    event.preventDefault();if(honeypot?.value)return;
    const name=String(nameInput?.value||'').trim();
    const email=String(emailInput?.value||'').trim();
    const bookId=String(bookSelect?.value||'').trim();
    const language=String(languageSelect?.value||'').trim();
    const reviewBn=String(bnInput?.value||'').trim();
    const reviewEn=String(enInput?.value||'').trim();
    const needsBn=language==='bn'||language==='both';
    const needsEn=language==='en'||language==='both';
    if(!name||!bookId||!language||(needsBn&&!reviewBn)||(needsEn&&!reviewEn)){setStatus(copy.required,'error');return;}
    if(email&&!/^\S+@\S+\.\S+$/.test(email)){setStatus(copy.email,'error');return;}
    if((language==='bn'||language==='en')&&!consentInput?.checked){setStatus(copy.consentRequired,'error');return;}
    if(!configured){setStatus(copy.unavailable,'error');return;}
    const isGeneralFeedback=bookId==='general-feedback';
    const book=bookById.get(bookId);
    if(!isGeneralFeedback&&!book){setStatus(copy.required,'error');return;}
    const submittedTitle=isGeneralFeedback?'General Feedback / সাধারণ মতামত':canonicalBookTitle(book);
    submit.disabled=true;setStatus(copy.submitting);
    try{
      const response=await fetch(`${supabaseUrl}/functions/v1/reader-review-submit`,{
        method:'POST',headers:apiHeaders(),
        body:JSON.stringify({name,email:email||null,book_id:bookId,book_title:submittedTitle,language,review_bn:reviewBn||null,review_en:reviewEn||null,ai_consent:Boolean(consentInput?.checked),website:String(honeypot?.value||'')})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok){if(data?.code==='translation_not_configured')throw Object.assign(new Error('translation_not_configured'),{code:'translation_not_configured'});throw new Error(data?.error||`HTTP ${response.status}`);}
      form.reset();setBookChoice('',copy.selectBook);setLanguageChoice('',copy.selectLanguage);updateLanguageFields();setStatus(copy.submitted,'success');
    }catch(err){
      console.warn('Reader review submission failed.',err);
      if(err?.code==='translation_not_configured'||String(err?.message||'')==='translation_not_configured')setStatus(copy.translationUnavailable,'error');
      else setStatus(copy.error,'error');
    }finally{submit.disabled=false;}
  });

  loadReviews();
})();
