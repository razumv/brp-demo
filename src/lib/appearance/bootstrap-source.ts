const APPEARANCE_BOOTSTRAP_SOURCE = String.raw`(function(){
  var w=window;
  var h=document.documentElement;
  var key="brp-appearance-v1";
  var legacyKey="brp-clone-theme";
  var fallback={version:1,designSystem:"shadcn",colorMode:"light"};
  function copy(value){
    return {version:1,designSystem:value.designSystem,colorMode:value.colorMode};
  }
  function valid(value){
    return !!value&&typeof value==="object"&&value.version===1&&
      (value.designSystem==="shadcn"||value.designSystem==="astryx")&&
      (value.colorMode==="system"||value.colorMode==="light"||value.colorMode==="dark");
  }
  function clearWatchdog(){
    if(w.__BRP_ASTRYX_WATCHDOG__!==undefined){
      clearTimeout(w.__BRP_ASTRYX_WATCHDOG__);
      delete w.__BRP_ASTRYX_WATCHDOG__;
    }
  }
  function resolved(value){
    if(value.colorMode!=="system")return value.colorMode;
    return matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
  }
  function clearAstryxMarkers(){
    h.removeAttribute("data-astryx-theme");
    h.removeAttribute("data-theme");
  }
  function apply(value){
    var theme=resolved(value);
    h.dataset.designSystem=value.designSystem;
    h.dataset.colorMode=value.colorMode;
    h.dataset.resolvedTheme=theme;
    h.classList.toggle("dark",theme==="dark");
    if(value.designSystem==="astryx"){
      h.dataset.astryxTheme="neutral";
      if(value.colorMode==="system")h.removeAttribute("data-theme");
      else h.dataset.theme=value.colorMode;
      h.dataset.rendererPending="true";
    }else{
      clearAstryxMarkers();
      h.removeAttribute("data-renderer-pending");
    }
  }
  function recover(code){
    clearWatchdog();
    try{localStorage.setItem(key,JSON.stringify(fallback));}catch(ignore){}
    w.__BRP_APPEARANCE_BOOTSTRAP__=copy(fallback);
    clearAstryxMarkers();
    h.dataset.designSystem="shadcn";
    h.dataset.colorMode="light";
    h.dataset.resolvedTheme="light";
    h.classList.toggle("dark",false);
    h.removeAttribute("data-renderer-pending");
    var diagnostic={at:Date.now(),code:code};
    w.__BRP_APPEARANCE_DIAGNOSTIC__=diagnostic;
    try{
      if(typeof CustomEvent==="function"&&typeof w.dispatchEvent==="function"){
        w.dispatchEvent(new CustomEvent("brp:appearance-recovery",{detail:diagnostic}));
      }
    }catch(ignore){}
  }
  clearWatchdog();
  var preference=null;
  try{
    var raw=localStorage.getItem(key);
    if(raw!==null){
      try{
        var parsed=JSON.parse(raw);
        if(valid(parsed))preference=copy(parsed);
      }catch(ignore){}
    }else{
      var legacy=localStorage.getItem(legacyKey);
      if(legacy==="light"||legacy==="dark"){
        var migrated={version:1,designSystem:"shadcn",colorMode:legacy};
        try{
          localStorage.setItem(key,JSON.stringify(migrated));
          preference=migrated;
          try{localStorage.removeItem(legacyKey);}catch(ignore){}
        }catch(ignore){}
      }
    }
  }catch(ignore){}
  if(!preference)preference=copy(fallback);
  w.__BRP_APPEARANCE_BOOTSTRAP__=copy(preference);
  try{
    apply(preference);
    if(preference.designSystem==="astryx"){
      w.__BRP_ASTRYX_WATCHDOG__=setTimeout(function(){recover("renderer-watchdog-timeout");},15000);
    }
  }catch(ignore){
    recover("bootstrap-application-failed");
  }
})();`;

export interface AppearanceBootstrapDiagnostic {
  at: number;
  code: string;
}

export function getAppearanceBootstrapSource(): string {
  return APPEARANCE_BOOTSTRAP_SOURCE;
}
