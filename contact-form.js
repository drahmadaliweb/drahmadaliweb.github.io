(() => {
  const form=document.getElementById('contactForm');
  if(!form)return;
  const isBn=document.documentElement.lang==='bn';
  const endpoint='https://formsubmit.co/ajax/drahmadiscu@gmail.com';
  const params=new URLSearchParams(location.search);
  const subject=document.getElementById('subject');
  const message=document.getElementById('message');
  const messageHelp=document.getElementById('messageHelp');
  const bookField=document.getElementById('bookTitleField');
  const bookTitle=document.getElementById('bookTitle');
  const submit=document.getElementById('contactSubmit');
  const status=document.getElementById('formStatus');
  const books=Array.isArray(window.ahmadAliBookDetails)?window.ahmadAliBookDetails:[];

  const copy=isBn?{
    bookPlaceholder:'যে বইটি/বইগুলো অর্ডার করতে চান, প্রতিটি বইয়ের সংখ্যা, সংগ্রহ বা ডেলিভারির পছন্দের পদ্ধতি/স্থান, আপনার অবস্থান এবং প্রয়োজনীয় অন্যান্য তথ্য লিখুন।',
    bookHelp:'একাধিক বই হলে বার্তার মধ্যে সব বইয়ের নাম ও পরিমাণ উল্লেখ করুন।',
    discussionPlaceholder:'আপনি যে বিষয় নিয়ে আলোচনা বা অনুসন্ধান করতে চান তা সংক্ষেপে ও স্পষ্টভাবে লিখুন।',
    discussionHelp:'প্রয়োজনে প্রাসঙ্গিক পটভূমি বা প্রসঙ্গ যোগ করুন।',
    questionPlaceholder:'আপনার প্রশ্নটি স্পষ্টভাবে লিখুন এবং প্রয়োজনীয় প্রাসঙ্গিক তথ্য দিন।',
    questionHelp:'একটি নির্দিষ্ট প্রশ্ন হলে যথাসম্ভব সংক্ষিপ্ত ও স্পষ্টভাবে লিখুন।',
    otherPlaceholder:'আপনার যোগাযোগের কারণ এবং প্রয়োজনীয় অন্যান্য তথ্য লিখুন।',
    otherHelp:'যথাযথ উত্তর দেওয়ার জন্য প্রয়োজনীয় তথ্য উল্লেখ করুন।',
    defaultPlaceholder:'উপর থেকে একটি বিষয় নির্বাচন করুন, তারপর আপনার প্রয়োজনটি লিখুন।',
    defaultHelp:'যথাযথ উত্তর দেওয়ার জন্য প্রয়োজনীয় তথ্য উল্লেখ করুন।',
    sending:'পাঠানো হচ্ছে…',success:'ধন্যবাদ। আপনার বার্তাটি সফলভাবে জমা হয়েছে।',error:'বার্তাটি পাঠানো যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',invalid:'অনুগ্রহ করে আবশ্যক ঘরগুলো সঠিকভাবে পূরণ করুন।',submit:'জমা দিন'
  }:{
    bookPlaceholder:'List the book title(s), quantity of each book, preferred method or place of collection/delivery, your location, and any other relevant details.',
    bookHelp:'For multiple books, include all titles and quantities in your message.',
    discussionPlaceholder:'Briefly describe the topic you would like to discuss or inquire about.',
    discussionHelp:'Add relevant background or context where useful.',
    questionPlaceholder:'Write your question clearly and include any relevant context.',
    questionHelp:'For a specific question, please be as clear and concise as possible.',
    otherPlaceholder:'Describe the reason for your message and any relevant details.',
    otherHelp:'Please provide enough detail for an appropriate response.',
    defaultPlaceholder:'Select a subject above, then tell us how we can help.',
    defaultHelp:'Please provide enough detail for an appropriate response.',
    sending:'Sending…',success:'Thank you. Your message has been submitted successfully.',error:'Your message could not be sent. Please try again.',invalid:'Please complete the required fields correctly.',submit:'Submit'
  };

  function selectedBook(){
    const id=params.get('bookId');
    if(!id)return params.get('book')||'';
    const book=books.find(item=>item.id===id);
    if(!book)return params.get('book')||'';
    const loc=isBn?(book.bn||book.en):(book.en||book.bn);
    return loc?.title||book.bn?.title||'';
  }

  function updateMessageGuide(){
    const value=subject.value;
    const isOrder=value==='book-order';
    bookField.hidden=!isOrder;
    bookTitle.required=isOrder;
    if(value==='book-order'){
      message.placeholder=copy.bookPlaceholder;messageHelp.textContent=copy.bookHelp;
    }else if(value==='academic-discussion'){
      message.placeholder=copy.discussionPlaceholder;messageHelp.textContent=copy.discussionHelp;
    }else if(value==='question'){
      message.placeholder=copy.questionPlaceholder;messageHelp.textContent=copy.questionHelp;
    }else if(value==='other'){
      message.placeholder=copy.otherPlaceholder;messageHelp.textContent=copy.otherHelp;
    }else{
      message.placeholder=copy.defaultPlaceholder;messageHelp.textContent=copy.defaultHelp;
    }
  }

  const requestedSubject=params.get('subject');
  if(['book-order','academic-discussion','question','other'].includes(requestedSubject))subject.value=requestedSubject;
  const preselectedBook=selectedBook();
  if(preselectedBook){subject.value='book-order';bookTitle.value=preselectedBook;}
  updateMessageGuide();
  subject.addEventListener('change',updateMessageGuide);

  // Preserve the order context when switching languages.
  document.querySelectorAll('.language-switch a').forEach(a=>{
    if(!params.toString())return;
    const u=new URL(a.getAttribute('href'),location.href);
    ['subject','bookId'].forEach(k=>{const v=params.get(k);if(v)u.searchParams.set(k,v);});
    a.setAttribute('href',`${u.pathname}${u.search}${location.hash||'#inquiry-form'}`);
  });

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    status.className='form-status';
    if(!form.checkValidity()){
      form.reportValidity();status.textContent=copy.invalid;status.classList.add('error');return;
    }
    if(document.getElementById('websiteField').value)return;
    submit.disabled=true;submit.textContent=copy.sending;status.textContent='';
    const subjectLabel=subject.options[subject.selectedIndex]?.textContent||subject.value;
    const payload={
      _subject:`Dr. Ahmad Ali Website — ${subjectLabel}`,
      _template:'table',
      _honey:'',
      full_name:document.getElementById('fullName').value.trim(),
      email:document.getElementById('email').value.trim(),
      _replyto:document.getElementById('email').value.trim(),
      phone:document.getElementById('phone').value.trim(),
      subject:subjectLabel,
      message:message.value.trim(),
      page:location.href
    };
    if(subject.value==='book-order')payload.book=bookTitle.value.trim();
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      form.reset();bookTitle.value='';updateMessageGuide();
      status.textContent=copy.success;status.classList.add('success');
    }catch(error){
      status.textContent=copy.error;status.classList.add('error');
    }finally{
      submit.disabled=false;submit.textContent=copy.submit;
    }
  });
})();
