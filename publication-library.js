(() => {
  const items = Array.isArray(window.ahmadAliPublications) ? window.ahmadAliPublications.slice() : [];
  const isBn = document.documentElement.lang === 'bn';
  const prefix = isBn ? '../' : '';
  const asset = u => !u ? u : (/^(?:https?:)?\/\//i.test(u) || u.startsWith('#') || u.startsWith('mailto:')) ? u : `${prefix}${u}`;
  const dateHtml = value => String(value || '').split(/\n+/).map(v => escapeHtml(v)).join('<br>');
  const escapeHtml = s => String(s ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const copy = isBn ? { article:'প্রবন্ধ', pdf:'PDF', doi:'DOI', link:'লিংক' } : { article:'Article', pdf:'PDF', doi:'DOI', link:'Link' };

  function makeArticle(item){
    const article=document.createElement('article'); article.id=item.id;
    const span=document.createElement('span'); span.innerHTML=dateHtml(isBn?item.dateLabelBn:item.dateLabelEn);
    const body=document.createElement('div'); const h=document.createElement('h3');
    if(item.type==='arabic') { h.textContent=item.titleAr||item.titleEn||item.titleBn||''; h.lang='ar'; h.dir='rtl'; }
    else {
      const title=isBn?(item.titleBn||item.titleEn):(item.titleEn||item.titleBn); h.textContent=title||'';
      if(!isBn && item.originalTitleBn && item.originalTitleBn!==title){ const small=document.createElement('small'); small.className='publication-original-title'; small.lang='bn'; small.textContent=item.originalTitleBn; h.appendChild(small); }
    }
    const p=document.createElement('p'); const source=isBn?(item.sourceBn||item.sourceEn||item.sourceAr):(item.sourceEn||item.sourceAr||item.sourceBn);
    if(source){ const em=document.createElement('em'); em.textContent=source; if(item.type==='arabic'){em.lang='ar';em.dir='rtl';} p.appendChild(em); }
    let details=isBn?(item.detailsBn||item.detailsEn):(item.detailsEn||item.detailsBn);
    if(!details){
      const bits=[];
      if(item.volume) bits.push(isBn?`খণ্ড ${item.volume}`:`Vol. ${item.volume}`);
      if(item.issue) bits.push(isBn?`সংখ্যা ${item.issue}`:`Issue ${item.issue}`);
      if(item.pages) bits.push(isBn?`পৃ. ${item.pages}`:`pp. ${item.pages}`);
      const issueDate=isBn?(item.issueDateBn||item.issueDateEn):(item.issueDateEn||item.issueDateBn);
      const onlineDate=isBn?(item.onlineDateBn||item.onlineDateEn):(item.onlineDateEn||item.onlineDateBn);
      const publisher=isBn?(item.publisherBn||item.publisherEn):(item.publisherEn||item.publisherBn);
      const notes=isBn?(item.notesBn||item.notesEn):(item.notesEn||item.notesBn);
      if(issueDate) bits.push(isBn?`মূল সংখ্যা প্রকাশকাল: ${issueDate}`:`Issue date: ${issueDate}`);
      if(onlineDate) bits.push(isBn?`অনলাইন প্রকাশ: ${onlineDate}`:`Online publication: ${onlineDate}`);
      if(publisher) bits.push(isBn?`প্রকাশক: ${publisher}`:`Publisher: ${publisher}`);
      if(notes) bits.push(notes);
      details=bits.join(' · ');
    }
    if(details){ if(source)p.append(' · '); p.append(details); }
    body.append(h,p);
    const links=document.createElement('div'); links.className='publication-links';
    const specs=[[item.articleUrl,copy.article],[item.pdfUrl,copy.pdf],[item.doi,copy.doi],[item.otherUrl,copy.link]];
    specs.filter(([u])=>u).forEach(([u,label])=>{const a=document.createElement('a');a.href=asset(u);a.target='_blank';a.rel='noopener';a.textContent=`${label} ↗`;links.appendChild(a);});
    if(links.children.length) body.appendChild(links);
    article.append(span,body); return article;
  }
  function renderList(id,type){const host=document.getElementById(id);if(!host)return;host.replaceChildren(...items.filter(x=>x.type===type).map(makeArticle));}
  function renderSimple(id,type){const host=document.getElementById(id);if(!host)return;host.replaceChildren();items.filter(x=>x.type===type).forEach(item=>{const li=document.createElement('li');const title=isBn?(item.titleBn||item.titleEn):(item.titleEn||item.titleBn);const details=isBn?(item.detailsBn||item.detailsEn):(item.detailsEn||item.detailsBn);li.textContent=details?`${title} — ${details}`:title;host.appendChild(li);});}
  renderList('publicationResearch','research'); renderList('publicationArabic','arabic'); renderSimple('publicationEdited','edited'); renderSimple('publicationTranslations','translation');
})();
