/* Rendering for Through the Window of Time.
   Post content itself lives only in posts-data.js. */
(() => {
  const posts = Array.isArray(window.windowOfTimePosts) ? window.windowOfTimePosts.slice() : [];
  const lang = document.documentElement.lang === 'bn' ? 'bn' : 'en';
  const locale = lang === 'bn' ? 'bn-BD' : 'en-GB';

  const copy = lang === 'bn' ? {
    latest: 'সর্বশেষ',
    read: 'পুরোটি পড়ুন',
    original: 'মূল লেখাটি দেখুন',
    back: 'সব লেখা দেখুন',
    empty: 'এখনও কোনো লেখা যোগ করা হয়নি।',
    missing: 'লেখাটি পাওয়া যায়নি।',
    source: 'উৎস'
  } : {
    latest: 'Latest',
    read: 'View Full',
    original: 'View original',
    back: 'Back to all writings',
    empty: 'No writings have been added yet.',
    missing: 'This writing could not be found.',
    source: 'Source'
  };

  function normalizeDate(value){
    const d = new Date(`${value || ''}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  posts.sort((a,b) => {
    const ad = normalizeDate(a.date)?.getTime() || 0;
    const bd = normalizeDate(b.date)?.getTime() || 0;
    return bd - ad;
  });

  function formatDate(value){
    const d = normalizeDate(value);
    if(!d) return '';
    return new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',day:'numeric'}).format(d);
  }

  function localized(post){ return post?.[lang] || post?.en || post?.bn || {}; }

  function slugify(text){
    return String(text || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9\u0980-\u09ff]+/g,'-')
      .replace(/^-+|-+$/g,'')
      .slice(0,90);
  }

  function postId(post,index){
    if(post.id) return String(post.id);
    const base = slugify(post.en?.title || post.bn?.title || `post-${index+1}`) || `post-${index+1}`;
    return `${post.date || 'undated'}-${base}`;
  }

  function cleanPlainText(body){
    return String(body || '')
      .split(/\r?\n/)
      .map(s=>s.trim())
      .filter(Boolean)
      .filter(line=>!/^\*{3}(?:\s+\*{3})+$/u.test(line) && !/^<{3}.*>{3}$/u.test(line))
      .map(line=>line.replace(/^#\s*/u,''))
      .join(' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function excerpt(body,max=330){
    const text=cleanPlainText(body);
    if(text.length<=max) return text;
    const cut=text.slice(0,max);
    const stop=Math.max(cut.lastIndexOf('।'),cut.lastIndexOf('.'),cut.lastIndexOf(' '));
    return `${cut.slice(0,stop>180?stop:max).trim()}…`;
  }

  function facebookIcon(){
    const wrap=document.createElement('span');
    wrap.className='source-icon facebook-logo';
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML='<svg viewBox="0 0 24 24" role="img"><circle cx="12" cy="12" r="12"></circle><path d="M13.6 20v-7h2.4l.36-2.73H13.6V8.53c0-.79.22-1.33 1.38-1.33h1.47V4.76c-.25-.03-1.13-.1-2.15-.1-2.13 0-3.59 1.3-3.59 3.69v1.92H8.3V13h2.41v7h2.89z"></path></svg>';
    return wrap;
  }

  function genericSourceIcon(){
    const wrap=document.createElement('span');
    wrap.className='source-icon generic-source-icon';
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML='<svg viewBox="0 0 24 24"><path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Zm1 3v1.5h7V7.5H6Zm0 4v1.5h12v-1.5H6Zm0 4v1.5h12v-1.5H6Zm9-8v1.5h3V7.5h-3Z"/></svg>';
    return wrap;
  }

  function sourceLink(post,compact=false){
    const src=post.source || {};
    if(!src.url && !src.label) return null;
    const a=document.createElement(src.url ? 'a' : 'span');
    a.className=compact?'post-source-chip':'post-source-link';
    if(src.url){ a.href=src.url; a.target='_blank'; a.rel='noopener noreferrer'; }
    a.appendChild(src.type==='facebook'?facebookIcon():genericSourceIcon());
    const text=document.createElement('span');
    text.textContent=src.label || copy.source;
    a.appendChild(text);
    return a;
  }

  function renderBody(container,body){
    container.replaceChildren();
    String(body || '').split(/\r?\n/).forEach(raw=>{
      const line=raw.trim();
      if(!line) return;
      if(/^\*{3}(?:\s+\*{3})+$/u.test(line)||/^<{3}.*>{3}$/u.test(line)){
        const divider=document.createElement('div'); divider.className='post-divider'; divider.setAttribute('aria-hidden','true'); container.appendChild(divider); return;
      }
      if(/^(?:\d+|[০-৯]+)\.\s+/u.test(line)){
        const h=document.createElement('h3'); h.textContent=line; container.appendChild(h); return;
      }
      if(/^#\s*/u.test(line)){
        const p=document.createElement('p'); p.className='post-question'; p.textContent=line.replace(/^#\s*/u,''); container.appendChild(p); return;
      }
      const p=document.createElement('p'); p.textContent=line; container.appendChild(p);
    });
  }

  function detailHref(post,index){ return `post.html?id=${encodeURIComponent(postId(post,index))}`; }

  const archive=document.getElementById('postsArchive');
  if(archive){
    if(!posts.length){ archive.textContent=copy.empty; return; }
    archive.replaceChildren();
    posts.forEach((post,index)=>{
      const loc=localized(post);
      const card=document.createElement('article');
      card.className=`writing-card${index===0?' featured':''}`;

      const meta=document.createElement('div'); meta.className='writing-meta';
      if(index===0){ const latest=document.createElement('span'); latest.className='latest-chip'; latest.textContent=copy.latest; meta.appendChild(latest); }
      const date=document.createElement('time'); date.dateTime=post.date||''; date.textContent=formatDate(post.date); meta.appendChild(date);
      const src=sourceLink(post,true); if(src) meta.appendChild(src);

      const title=document.createElement('h2');
      const titleLink=document.createElement('a'); titleLink.href=detailHref(post,index); titleLink.textContent=loc.title||''; title.appendChild(titleLink);
      const ex=document.createElement('p'); ex.className='writing-excerpt'; ex.textContent=loc.excerpt || excerpt(loc.body);
      const actions=document.createElement('div'); actions.className='writing-actions';
      const read=document.createElement('a'); read.className='read-full-link'; read.href=detailHref(post,index); read.textContent=`${copy.read} →`; actions.appendChild(read);
      if(post.source?.url){
        const original=document.createElement('a'); original.className='original-mini-link'; original.href=post.source.url; original.target='_blank'; original.rel='noopener noreferrer'; original.textContent=`${copy.original} ↗`; actions.appendChild(original);
      }
      card.append(meta,title,ex,actions); archive.appendChild(card);
    });
  }

  const detail=document.getElementById('postDetail');
  if(detail){
    const params=new URLSearchParams(location.search);
    const requested=params.get('id');
    const index=posts.findIndex((p,i)=>postId(p,i)===requested);
    const post=index>=0?posts[index]:null;
    if(!post){
      detail.innerHTML='';
      const p=document.createElement('p'); p.className='page-lead'; p.textContent=copy.missing;
      const back=document.createElement('a'); back.className='inline-arrow'; back.href='window-of-time.html'; back.textContent=`← ${copy.back}`;
      detail.append(p,back);
      return;
    }
    const loc=localized(post);
    const title=document.getElementById('postDetailTitle');
    const date=document.getElementById('postDetailDate');
    const sourceSlot=document.getElementById('postDetailSource');
    const body=document.getElementById('postDetailBody');
    if(title) title.textContent=loc.title||'';
    if(date){date.dateTime=post.date||''; date.textContent=formatDate(post.date);}
    if(sourceSlot){const src=sourceLink(post,false); if(src) sourceSlot.replaceChildren(src); else sourceSlot.replaceChildren();}
    if(body) renderBody(body,loc.body);
    document.title=`${loc.title || 'Writing'} | ${lang==='bn'?'ড. আহমদ আলী':'Dr. Ahmad Ali'}`;

    const desc=document.querySelector('meta[name="description"]');
    if(desc) desc.setAttribute('content',excerpt(loc.body,155));

    document.querySelectorAll('.language-switch a').forEach(a=>{
      const href=a.getAttribute('href');
      if(href) a.setAttribute('href',`${href}?id=${encodeURIComponent(requested)}`);
    });
  }
})();
