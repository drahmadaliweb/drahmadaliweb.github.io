(() => {
  const config=window.AHMAD_ALI_REVIEW_CONFIG||{};
  const siteKey=String(config.turnstileSiteKey||'').trim();
  const states=new Map();
  let loader=null;

  function stateFor(id){
    if(!states.has(id))states.set(id,{widgetId:null,token:'',waiters:[],action:''});
    return states.get(id);
  }

  function settle(state,error=null){
    const waiters=state.waiters.splice(0);
    for(const waiter of waiters){
      clearTimeout(waiter.timer);
      if(error)waiter.reject(error);
      else waiter.resolve(state.token);
    }
  }

  function loadApi(){
    if(window.turnstile?.render)return Promise.resolve(window.turnstile);
    if(loader)return loader;
    loader=new Promise((resolve,reject)=>{
      const callback='__ahmadAliTurnstileReady';
      const old=window[callback];
      window[callback]=()=>{
        try{if(typeof old==='function')old();}catch(_e){}
        if(window.turnstile?.render)resolve(window.turnstile);
        else reject(new Error('Turnstile API did not initialize.'));
      };
      const existing=[...document.scripts].find(s=>String(s.src||'').includes('challenges.cloudflare.com/turnstile/'));
      if(existing){
        const timer=setInterval(()=>{
          if(window.turnstile?.render){clearInterval(timer);resolve(window.turnstile);}
        },50);
        setTimeout(()=>{clearInterval(timer);if(!window.turnstile?.render)reject(new Error('Turnstile API did not load.'));},12000);
        return;
      }
      const script=document.createElement('script');
      script.src=`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${callback}`;
      script.async=true;
      script.defer=true;
      script.onerror=()=>reject(new Error('Turnstile API could not be loaded.'));
      document.head.appendChild(script);
    });
    return loader;
  }

  async function mount(containerId,action){
    if(!siteKey)throw new Error('Turnstile site key is missing.');
    const container=document.getElementById(containerId);
    if(!container)throw new Error(`Turnstile container not found: ${containerId}`);
    const state=stateFor(containerId);
    if(state.widgetId!==null)return state.widgetId;
    state.action=String(action||'review').slice(0,32);
    const api=await loadApi();
    state.widgetId=api.render(container,{
      sitekey:siteKey,
      action:state.action,
      theme:'auto',
      appearance:'interaction-only',
      callback:token=>{state.token=String(token||'');settle(state);},
      'expired-callback':()=>{state.token='';},
      'timeout-callback':()=>{state.token='';settle(state,new Error('Security check timed out.'));},
      'error-callback':()=>{state.token='';settle(state,new Error('Security check failed to load.'));return true;}
    });
    return state.widgetId;
  }

  async function ensureToken(containerId,action){
    await mount(containerId,action);
    const state=stateFor(containerId);
    if(state.token)return state.token;
    return await new Promise((resolve,reject)=>{
      const waiter={resolve,reject,timer:null};
      waiter.timer=setTimeout(()=>{
        const i=state.waiters.indexOf(waiter);
        if(i>=0)state.waiters.splice(i,1);
        reject(new Error('Security check timed out.'));
      },60000);
      state.waiters.push(waiter);
    });
  }

  function reset(containerId){
    const state=states.get(containerId);
    if(!state)return;
    state.token='';
    if(state.widgetId!==null&&window.turnstile?.reset){
      try{window.turnstile.reset(state.widgetId);}catch(_e){}
    }
  }

  window.AhmadAliReviewTurnstile={
    configured:Boolean(siteKey),
    mount,
    ensureToken,
    reset
  };
})();
