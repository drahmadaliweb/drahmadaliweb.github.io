(() => {
  const host=document.getElementById('readerReviews');
  if(!host)return;
  const isBn=document.documentElement.lang==='bn';
  const bookId=document.querySelector('meta[name="content-id"]')?.content||new URLSearchParams(location.search).get('id');
  if(!bookId){host.hidden=true;return;}

  const config=window.AHMAD_ALI_REVIEW_CONFIG||{};
  const url=String(config.supabaseUrl||'').replace(/\/$/,'');
  const key=String(config.publishableKey||config.anonKey||'').trim();
  const configured=Boolean(url&&key);
  const books=Array.isArray(window.ahmadAliBookDetails)?window.ahmadAliBookDetails:[];
  const book=books.find(b=>b.id===bookId);
  const localized=book?.[isBn?'bn':'en']||book?.en||book?.bn||{};

  const copy=isBn?{
    open:'রিভিউ দিতে এখানে ক্লিক করুন।',close:'রিভিউ ফর্ম বন্ধ করুন',
    selectLanguage:'ভাষা নির্বাচন করুন',langBn:'বাংলা',langEn:'ইংরেজি',langBoth:'বাংলা ও ইংরেজি উভয় ভাষায়',
    consentBn:'আমি সম্মতি দিচ্ছি যে, এই বাংলা রিভিউটি ওয়েবসাইটের ইংরেজি সংস্করণে প্রদর্শনের জন্য AI ব্যবহার করে ইংরেজিতে অনুবাদ করা হতে পারে।',
    consentEn:'আমি সম্মতি দিচ্ছি যে, এই ইংরেজি রিভিউটি ওয়েবসাইটের বাংলা সংস্করণে প্রদর্শনের জন্য AI ব্যবহার করে বাংলায় অনুবাদ করা হতে পারে।',
    required:'নাম, রিভিউয়ের ভাষা এবং প্রয়োজনীয় রিভিউ লিখুন।',
    consentRequired:'AI অনুবাদের সম্মতিতে টিক দিন, অথবা উভয় ভাষায় রিভিউ দিন।',
    email:'সঠিক ইমেইল ঠিকানা লিখুন অথবা ইমেইল ঘরটি খালি রাখুন।',
    submitting:'রিভিউ জমা দেওয়া হচ্ছে…',
    submitted:'ধন্যবাদ। আপনার রিভিউটি পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের পর এটি এই গ্রন্থের পাতায় প্রকাশিত হবে।',
    unavailable:'রিভিউ জমা দেওয়ার সেবা এখনো সম্পূর্ণভাবে চালু হয়নি।',
    translationUnavailable:'AI অনুবাদ সেবা এখনো সক্রিয় নয়। আপাতত উভয় ভাষায় রিভিউ দিন অথবা পরে আবার চেষ্টা করুন।',
    error:'রিভিউ জমা দেওয়া যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
    loading:'রিভিউ লোড হচ্ছে…',none:'এই বইটির জন্য এখনো কোনো পাঠক-রিভিউ প্রকাশিত হয়নি।',
    seeMore:'পুরোটা পড়ুন',seeLess:'সংক্ষেপে দেখুন',
    count:n=>`${new Intl.NumberFormat('bn-BD').format(n)}টি রিভিউ`,
    date:d=>new Intl.DateTimeFormat('bn-BD',{day:'numeric',month:'long',year:'numeric'}).format(d)
  }:{
    open:'Click here to give a review.',close:'Close the review form',
    selectLanguage:'Select language',langBn:'Bengali',langEn:'English',langBoth:'Both Bengali and English',
    consentBn:'I agree that this Bengali review may be translated into English using AI for display on the English version of this website.',
    consentEn:'I agree that this English review may be translated into Bengali using AI for display on the Bengali version of this website.',
    required:'Please enter your name, select the review language, and complete the required review field(s).',
    consentRequired:'Please agree to the AI translation, or submit the review in both languages.',
    email:'Enter a valid email address, or leave the email field blank.',
    submitting:'Submitting your review…',
    submitted:'Thank you. Your review has been submitted for moderation and will appear on this book page after approval.',
    unavailable:'Reader-review submission has not been fully activated yet.',
    translationUnavailable:'AI translation is not active yet. For now, submit both Bengali and English versions or try again later.',
    error:'We could not submit your review. Please try again later.',
    loading:'Loading reviews…',none:'No reader reviews have been published for this book yet.',
    seeMore:'See More',seeLess:'See Less',
    count:n=>`${n} review${n===1?'':'s'}`,
    date:d=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(d)
  };

  const toggle=document.getElementById('reviewFormToggle');
  const form=document.getElementById('bookReviewForm');
  const name=document.getElementById('reviewName');
  const email=document.getElementById('reviewEmail');
  const bookLabel=document.getElementById('bookReviewBookLabel');
  const languageSelect=document.getElementById('bookReviewLanguage');
  const languagePicker=document.getElementById('bookReviewLanguagePicker');
  const languageToggle=document.getElementById('bookReviewLanguageToggle');
  const languageMenu=document.getElementById('bookReviewLanguageMenu');
  const languageLabel=document.getElementById('bookReviewLanguageLabel');
  const consentWrap=document.getElementById('bookReviewConsentWrap');
  const consentInput=document.getElementById('bookReviewAiConsent');
  const consentText=document.getElementById('bookReviewConsentText');
  const bnWrap=document.getElementById('bookReviewBnWrap');
  const enWrap=document.getElementById('bookReviewEnWrap');
  const bnInput=document.getElementById('bookReviewBn');
  const enInput=document.getElementById('bookReviewEn');
  const bnCounter=document.getElementById('bookReviewBnCounter');
  const enCounter=document.getElementById('bookReviewEnCounter');
  const honeypot=document.getElementById('reviewWebsite');
  const submit=document.getElementById('reviewSubmit');
  const status=document.getElementById('reviewFormStatus');
  const list=document.getElementById('bookReviewList');
  const empty=document.getElementById('bookReviewEmpty');
  const count=document.getElementById('reviewCount');
  const turnstile=window.AhmadAliReviewTurnstile;

  function canonicalBookTitle(){
    const title=String(book?.bn?.title||book?.en?.originalTitle||localized.title||bookId).trim();
    const subtitle=String(book?.bn?.subtitle||'').trim();
    return subtitle?`${title} : ${subtitle}`:title;
  }

  function localBookTitle(){
    const loc=book?.[isBn?'bn':'en']||book?.en||book?.bn||{};
    const title=String(loc.title||book?.bn?.title||book?.id||'').trim();
    const subtitle=String(loc.subtitle||'').trim();
    return subtitle?`${title}: ${subtitle}`:title;
  }
  if(bookLabel)bookLabel.textContent=localBookTitle();

  function setStatus(message,type=''){
    if(!status)return;
    status.textContent=message||'';
    status.className=`review-form-status${type?` ${type}`:''}`;
  }

  function liveWordCount(value){
    const text=String(value||'').trim();
    return text?text.split(/\s+/u).filter(Boolean).length:0;
  }

  function setLiveCounter(input,counter){
    if(!counter)return;
    const chars=String(input?.value||'').length;
    const words=liveWordCount(input?.value);
    if(isBn){
      const nf=new Intl.NumberFormat('bn-BD');
      counter.textContent=`${nf.format(words)} শব্দ · ${nf.format(chars)} / ${nf.format(10000)} অক্ষর`;
    }else{
      counter.textContent=`${words.toLocaleString('en-US')} word${words===1?'':'s'} · ${chars.toLocaleString('en-US')} / 10,000 characters`;
    }
  }

  const updateBnCounter=()=>setLiveCounter(bnInput,bnCounter);
  const updateEnCounter=()=>setLiveCounter(enInput,enCounter);
  bnInput?.addEventListener('input',updateBnCounter);
  enInput?.addEventListener('input',updateEnCounter);
  updateBnCounter();
  updateEnCounter();

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
    if(consentInput){
      consentInput.required=needConsent;
      consentInput.setAttribute('aria-required',String(needConsent));
      if(!needConsent)consentInput.checked=false;
    }
    if(consentText)consentText.textContent=lang==='bn'?copy.consentBn:lang==='en'?copy.consentEn:'';
  }

  languageSelect?.addEventListener('change',updateLanguageFields);
  updateLanguageFields();

  function setOpen(open){
    if(!form||!toggle)return;
    form.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open?copy.close:copy.open;
    if(open){
      setTimeout(()=>name?.focus(),0);
      turnstile?.mount('bookReviewTurnstile','reader_review').catch(()=>{});
    }
  }
  toggle?.addEventListener('click',()=>setOpen(form?.hidden!==false));

  function apiHeaders(){return {'apikey':key,'Content-Type':'application/json'};}

  function reviewDate(item){
    if(item.source_date){
      const d=new Date(`${item.source_date}T12:00:00`);
      return Number.isNaN(d.getTime())?null:d;
    }
    if(item.source==='website'){
      const d=new Date(item.created_at);
      return Number.isNaN(d.getTime())?null:d;
    }
    return null;
  }

  function sourceLabel(item){
    if(item.source==='rokomari')return isBn?'মূলত Rokomari-তে প্রকাশিত':'Originally posted on Rokomari';
    if(item.source==='facebook')return isBn?'মূলত Facebook-এ প্রকাশিত':'Originally posted on Facebook';
    if(item.source==='bdbooks')return isBn?'মূলত BDBOOKS-এ প্রকাশিত':'Originally posted on BDBOOKS';
    if(item.source==='goodreads')return isBn?'মূলত Goodreads-এ প্রকাশিত':'Originally posted on Goodreads';
    if(item.source==='iqaamah')return isBn?'মূলত Iqaamah Blog-এ প্রকাশিত':'Originally posted on Iqaamah Blog';
    return '';
  }

  function reviewPreview(text,limit=100){
    const value=String(text||'');
    const words=[...value.matchAll(/\S+/g)];
    if(words.length<=limit)return null;
    const last=words[limit-1];
    const end=last.index+last[0].length;
    return `${value.slice(0,end).trimEnd()}…`;
  }

  function reviewCard(item){
    const article=document.createElement('article');article.className='reader-review-item';
    const head=document.createElement('div');head.className='reader-review-meta';
    const who=document.createElement('strong');who.textContent=String(item.name||'').trim();
    head.append(who);

    const dt=reviewDate(item);
    if(dt){
      const time=document.createElement('time');
      time.dateTime=dt.toISOString();
      time.textContent=copy.date(dt);
      head.append(time);
    }

    const p=document.createElement('p');
    const reviewText=isBn
      ? String(item.review||item.review_en||'').trim()
      : String(item.review_en||item.review||'').trim();
    const preview=reviewPreview(reviewText);

    if(preview){
      const text=document.createElement('span');
      text.textContent=preview;
      const more=document.createElement('button');
      more.type='button';
      more.className='review-toggle-link';
      more.textContent=copy.seeMore;
      more.setAttribute('aria-expanded','false');
      let expanded=false;
      more.addEventListener('click',()=>{
        expanded=!expanded;
        text.textContent=expanded?reviewText:preview;
        more.textContent=expanded?copy.seeLess:copy.seeMore;
        more.setAttribute('aria-expanded',String(expanded));
      });
      p.append(text,document.createTextNode(' '),more);
    }else{
      p.textContent=reviewText;
    }

    article.append(head,p);

    const label=sourceLabel(item);
    if(label){
      const source=document.createElement('div');source.className='reader-review-source';
      if(item.source_url){
        const a=document.createElement('a');
        a.href=String(item.source_url);
        a.target='_blank';
        a.rel='noopener';
        a.textContent=`${label} ↗`;
        source.append(a);
      }else{
        source.textContent=label;
      }
      article.append(source);
    }

    return article;
  }

  async function loadReviews(){
    if(!list||!empty||!count)return;
    list.replaceChildren();
    count.textContent='';
    empty.textContent=configured?copy.loading:copy.none;
    empty.hidden=false;
    if(!configured)return;

    try{
      const response=await fetch(`${url}/rest/v1/rpc/get_book_reviews`,{
        method:'POST',headers:apiHeaders(),body:JSON.stringify({p_book_id:bookId})
      });
      if(!response.ok)throw new Error(`HTTP ${response.status}`);

      const rows=await response.json();
      const reviews=Array.isArray(rows)?rows.slice():[];
      reviews.sort((a,b)=>{
        const ad=a.source_date?new Date(`${a.source_date}T12:00:00`):new Date(a.created_at);
        const bd=b.source_date?new Date(`${b.source_date}T12:00:00`):new Date(b.created_at);
        return bd-ad;
      });

      list.replaceChildren(...reviews.map(reviewCard));
      count.textContent=reviews.length?copy.count(reviews.length):'';
      empty.textContent=copy.none;
      empty.hidden=reviews.length>0;
    }catch(err){
      console.warn('Reader reviews could not be loaded.',err);
      empty.textContent=copy.none;
      empty.hidden=false;
    }
  }

  form?.addEventListener('submit',async event=>{
    event.preventDefault();
    if(honeypot?.value)return;

    const n=String(name?.value||'').trim();
    const e=String(email?.value||'').trim();
    const language=String(languageSelect?.value||'').trim();
    const reviewBn=String(bnInput?.value||'').trim();
    const reviewEn=String(enInput?.value||'').trim();
    const needsBn=language==='bn'||language==='both';
    const needsEn=language==='en'||language==='both';

    if(!n||!language||(needsBn&&!reviewBn)||(needsEn&&!reviewEn)){
      setStatus(copy.required,'error');
      return;
    }
    if(e&&!/^\S+@\S+\.\S+$/.test(e)){
      setStatus(copy.email,'error');
      return;
    }
    if((language==='bn'||language==='en')&&!consentInput?.checked){
      setStatus(copy.consentRequired,'error');
      return;
    }
    if(!configured||!turnstile?.configured){
      setStatus(copy.unavailable,'error');
      return;
    }

    submit.disabled=true;
    setStatus(copy.submitting);

    try{
      const turnstileToken=await turnstile.ensureToken('bookReviewTurnstile','reader_review');
      const response=await fetch(`${url}/functions/v1/reader-review-submit`,{
        method:'POST',
        headers:apiHeaders(),
        body:JSON.stringify({
          submission_type:'reader-review-page',
          turnstile_token:turnstileToken,
          name:n,
          email:e||null,
          book_id:bookId,
          book_title:canonicalBookTitle(),
          language,
          review_bn:reviewBn||null,
          review_en:reviewEn||null,
          ai_consent:Boolean(consentInput?.checked),
          website:String(honeypot?.value||'')
        })
      });

      const data=await response.json().catch(()=>({}));
      if(!response.ok){
        if(data?.code==='translation_not_configured'){
          throw Object.assign(new Error('translation_not_configured'),{code:'translation_not_configured'});
        }
        throw new Error(data?.error||`HTTP ${response.status}`);
      }

      form.reset();
      updateBnCounter();
      updateEnCounter();
      setLanguageChoice('',copy.selectLanguage);
      updateLanguageFields();
      setStatus(copy.submitted,'success');
    }catch(err){
      console.warn('Reader review submission failed.',err);
      if(err?.code==='translation_not_configured'||String(err?.message||'')==='translation_not_configured'){
        setStatus(copy.translationUnavailable,'error');
      }else{
        setStatus(copy.error,'error');
      }
    }finally{
      turnstile?.reset('bookReviewTurnstile');
      submit.disabled=false;
    }
  });

  loadReviews();
})();
