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
    submitting:'রিভিউ জমা দেওয়া হচ্ছে…',submitted:'ধন্যবাদ। আপনার রিভিউটি পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের পর এটি এখানে প্রকাশিত হবে।',
    required:'নাম ও রিভিউ লিখুন।',email:'সঠিক ইমেইল ঠিকানা লিখুন অথবা ইমেইল ঘরটি খালি রাখুন।',
    unavailable:'রিভিউ জমা দেওয়ার সেবা এখনো চালু করা হয়নি।',error:'রিভিউ জমা দেওয়া যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
    loading:'রিভিউ লোড হচ্ছে…',none:'এই বইটির জন্য এখনো কোনো পাঠক-রিভিউ প্রকাশিত হয়নি।',
    seeMore:'পুরোটা পড়ুন',seeLess:'সংক্ষেপে দেখুন',
    count:n=>`${new Intl.NumberFormat('bn-BD').format(n)}টি রিভিউ`,
    date:d=>new Intl.DateTimeFormat('bn-BD',{day:'numeric',month:'long',year:'numeric'}).format(d)
  }:{
    open:'Click here to give a review.',close:'Close the review form',
    submitting:'Submitting your review…',submitted:'Thank you. Your review has been submitted for moderation and will appear here after approval.',
    required:'Please enter your name and review.',email:'Enter a valid email address, or leave the email field blank.',
    unavailable:'Reader-review submission has not been activated yet.',error:'We could not submit your review. Please try again later.',
    loading:'Loading reviews…',none:'No reader reviews have been published for this book yet.',
    seeMore:'See More',seeLess:'See Less',
    count:n=>`${n} review${n===1?'':'s'}`,
    date:d=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(d)
  };

  const toggle=document.getElementById('reviewFormToggle');
  const form=document.getElementById('bookReviewForm');
  const name=document.getElementById('reviewName');
  const email=document.getElementById('reviewEmail');
  const review=document.getElementById('reviewText');
  const honeypot=document.getElementById('reviewWebsite');
  const submit=document.getElementById('reviewSubmit');
  const status=document.getElementById('reviewFormStatus');
  const list=document.getElementById('bookReviewList');
  const empty=document.getElementById('bookReviewEmpty');
  const count=document.getElementById('reviewCount');
  const turnstile=window.AhmadAliReviewTurnstile;

  function setStatus(message,type=''){
    if(!status)return;
    status.textContent=message||'';
    status.className=`review-form-status${type?` ${type}`:''}`;
  }
  function setOpen(open){
    if(!form||!toggle)return;
    form.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open?copy.close:copy.open;
    if(open){setTimeout(()=>name?.focus(),0);turnstile?.mount('bookReviewTurnstile','book_review').catch(()=>{});}
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
      ? String(item.review||'').trim()
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
      empty.textContent=copy.none;empty.hidden=reviews.length>0;
    }catch(err){
      console.warn('Reader reviews could not be loaded.',err);
      empty.textContent=copy.none;empty.hidden=false;
    }
  }

  form?.addEventListener('submit',async event=>{
    event.preventDefault();
    if(honeypot?.value)return;
    const n=String(name?.value||'').trim();
    const e=String(email?.value||'').trim();
    const r=String(review?.value||'').trim();
    if(!n||!r){setStatus(copy.required,'error');return;}
    if(e&&!/^\S+@\S+\.\S+$/.test(e)){setStatus(copy.email,'error');return;}
    if(!configured||!turnstile?.configured){setStatus(copy.unavailable,'error');return;}
    submit.disabled=true;setStatus(copy.submitting);
    try{
      const turnstileToken=await turnstile.ensureToken('bookReviewTurnstile','book_review');
      const response=await fetch(`${url}/functions/v1/reader-review-submit`,{
        method:'POST',headers:apiHeaders(),body:JSON.stringify({
          submission_type:'book-page',turnstile_token:turnstileToken,
          book_id:bookId,book_title:localized.title||book?.bn?.title||bookId,
          name:n,email:e||null,review:r,page_language:isBn?'bn':'en',website:String(honeypot?.value||'')
        })
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data?.error||`HTTP ${response.status}`);
      form.reset();setStatus(copy.submitted,'success');
    }catch(err){console.warn('Reader review submission failed.',err);setStatus(copy.error,'error');}
    finally{turnstile?.reset('bookReviewTurnstile');submit.disabled=false;}
  });

  loadReviews();
})();
