(() => {const $ = s => document.querySelector(s);
let active = 'renfo', activeDay = 1, mode = 'login', supabase = null, currentUser = null;
let progress = { renfo: [], tabata: [] };
const order = Array.from({length:25}, (_, i) => i + 1);
const legacyKey = c => 'avent-progress-' + c;
function show(id) { ['auth','home','calendar','detail'].forEach(x => $('#'+x).classList.toggle('hidden', x !== id)); }
function message(text, error=false) { $('#auth-message').textContent=text; $('#auth-message').classList.toggle('error',error); }
function configured() { return window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('COLLE_') && !window.SUPABASE_ANON_KEY.includes('COLLE_'); }
function setMode(next) {
  mode=next; const signup=next==='signup';
  $('#show-login').classList.toggle('active',!signup); $('#show-signup').classList.toggle('active',signup);
  $('#name-label').classList.toggle('hidden',!signup); $('#auth-name').classList.toggle('hidden',!signup); $('#auth-name').required=signup;
  $('#auth-submit').textContent=signup?'Créer mon compte':'Se connecter'; $('#auth-password').autocomplete=signup?'new-password':'current-password';
  $('#forgot-password').classList.toggle('hidden',signup); message('');
}
async function loadProgress() {
  const {data,error}=await supabase.from('progress').select('calendar_type,completed_days').eq('user_id',currentUser.id);
  if(error) throw error;
  progress={renfo:[],tabata:[]};
  (data||[]).forEach(row=>{if(row.calendar_type==='renfo'||row.calendar_type==='tabata') progress[row.calendar_type]=row.completed_days||[];});
  // Migration des anciennes cases locales vers le compte, sans écraser la progression distante.
  for (const c of ['renfo','tabata']) {
    let old=[]; try { old=JSON.parse(localStorage.getItem(legacyKey(c))||'[]'); } catch {}
    const merged=[...new Set([...progress[c],...old])].filter(n=>Number.isInteger(n)&&n>=1&&n<=25).sort((a,b)=>a-b);
    if(merged.length!==progress[c].length) {
      const {error:saveError}=await supabase.from('progress').upsert({user_id:currentUser.id,calendar_type:c,completed_days:merged,updated_at:new Date().toISOString()},{onConflict:'user_id,calendar_type'});
      if(saveError) throw saveError;
      progress[c]=merged;
    }
    localStorage.removeItem(legacyKey(c));
  }
}
async function saveProgress(c) {
  const {error}=await supabase.from('progress').upsert({user_id:currentUser.id,calendar_type:c,completed_days:progress[c],updated_at:new Date().toISOString()},{onConflict:'user_id,calendar_type'});
  if(error) throw error;
}
function done(c) { return progress[c]||[]; }
function render(c) {
  active=c; $('#calendar-title').textContent=c.toUpperCase();
  $('#calendar-subtitle').textContent=c==='renfo'?'25 défis de renforcement musculaire':'25 séances Tabata';
  const completed=done(c), unlockedCount=Math.min(order.length,completed.length+1);
  $('#progress-fill').style.width=(completed.length/25*100)+'%'; $('#progress-label').textContent=completed.length+' / 25 défis réalisés'; $('#days').innerHTML='';
  order.forEach((n,i)=>{const b=document.createElement('button');const isDone=completed.includes(n),locked=i>=unlockedCount&&!isDone;b.className='day'+(isDone?' done':'')+(locked?' locked':'');b.innerHTML='<span class="day-number">'+n+'</span>'+(locked?'<span class="day-lock">🔒</span>':'');b.disabled=locked;b.setAttribute('aria-label','Case '+n+(locked?', verrouillée':isDone?', terminée':', à découvrir'));b.onclick=()=>openDay(n);$('#days').appendChild(b);}); show('calendar');
}
function makeLink(label,url){if(!url)return null;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;a.className='video-link';return a;}
function openDay(n){activeDay=n;const x=CALENDAR_DATA[active][n-1];$('#day-title').textContent='Case '+n+' – '+x.title;$('#day-details').textContent=x.details||'';const oldPhoto=$('#day-photo');if(oldPhoto)oldPhoto.remove();if(x.image){const img=document.createElement('img');img.id='day-photo';img.src=x.image;img.alt='Illustration du défi';img.className='day-photo';$('#day-details').insertAdjacentElement('afterend',img);}$('#day-rounds').textContent=x.rounds||'';const old=$('#exercise-help');if(old)old.remove();const box=document.createElement('div');box.id='exercise-help';box.className='exercise-help';if(x.explanation){const p=document.createElement('p');p.className='coach-message';p.textContent=x.explanation;box.appendChild(p);}if(x.video)box.appendChild(makeLink('▶ Voir la vidéo de démonstration',x.video));if(x.music){const p=document.createElement('p');p.className='link-heading';p.textContent='Musique';box.appendChild(p);box.appendChild(makeLink('♫ Écouter la musique',x.music));}if(x.exercises&&x.exercises.length){const h=document.createElement('p');h.className='link-heading';h.textContent='Vidéos des exercices';box.appendChild(h);const ul=document.createElement('ul');ul.className='exercise-links';x.exercises.forEach(e=>{const li=document.createElement('li');li.appendChild(makeLink('▶ '+e.name,e.url));ul.appendChild(li);});box.appendChild(ul);}if(box.children.length)$('#day-rounds').insertAdjacentElement('afterend',box);const finished=done(active).includes(n);$('#complete').disabled=finished;$('#complete').textContent=finished?'Défi déjà réalisé ✓':'Défi réalisé ! ✓';show('detail');}
async function enterApp(user){currentUser=user;try{await loadProgress();const {data}=await supabase.from('profiles').select('display_name').eq('id',user.id).maybeSingle();$('#welcome-user').textContent='Bonjour '+(data?.display_name||user.user_metadata?.first_name||user.email)+' !';show('home');}catch(e){show('auth');message('Impossible de charger ta progression : '+e.message,true);}}
$('#show-login').onclick=()=>setMode('login');$('#show-signup').onclick=()=>setMode('signup');
$('#auth-form').onsubmit=async e=>{e.preventDefault();if(!supabase){message('La connexion Supabase doit être configurée avant les inscriptions.',true);return;}const email=$('#auth-email').value.trim(),password=$('#auth-password').value;$('#auth-submit').disabled=true;try{if(mode==='signup'){const first=$('#auth-name').value.trim();const {data,error}=await supabase.auth.signUp({email,password,options:{data:{first_name:first},emailRedirectTo:window.location.origin+window.location.pathname}});if(error)throw error;if(data.session)await enterApp(data.user);else message('Compte créé ! Consulte ta boîte e-mail pour confirmer ton adresse avant de te connecter.');}else{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;await enterApp(data.user);}}catch(err){message(err.message||'Une erreur est survenue.',true);}finally{$('#auth-submit').disabled=false;}};
$('#forgot-password').onclick=async()=>{if(!supabase)return;const email=$('#auth-email').value.trim();if(!email){message('Saisis d’abord ton adresse e-mail.',true);return;}try{const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname});if(error)throw error;message('Si cette adresse correspond à un compte, un e-mail de réinitialisation va être envoyé.');}catch(e){message(e.message,true);}};
$('#logout').onclick=async()=>{await supabase.auth.signOut();currentUser=null;progress={renfo:[],tabata:[]};setMode('login');show('auth');};
document.querySelectorAll('[data-calendar]').forEach(b=>b.onclick=()=>render(b.dataset.calendar));$('#back').onclick=()=>show('home');$('#detail-back').onclick=()=>render(active);
$('#complete').onclick=async()=>{if(done(active).includes(activeDay))return;$('#complete').disabled=true;progress[active]=[...done(active),activeDay].sort((a,b)=>a-b);try{await saveProgress(active);render(active);}catch(e){progress[active]=progress[active].filter(n=>n!==activeDay);$('#complete').disabled=false;alert('La sauvegarde a échoué : '+e.message);}};
(async()=>{
  if(!configured()){
    show('auth');
    message('Configuration Supabase manquante : ajoute l’URL du projet et la clé Publishable dans config.js.',true);
    return;
  }

  if(!window.supabase?.createClient){
    message('Le service de connexion ne s’est pas chargé. Vérifie ta connexion internet.',true);
    return;
  }

  supabase=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);

  let recoveryMode=false;

  function showRecoveryForm(){
    let panel=document.getElementById('password-recovery');
    if(!panel){
      panel=document.createElement('div');
      panel.id='password-recovery';
      panel.style.cssText='position:fixed;inset:0;z-index:99999;background:white;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:25px;text-align:center;gap:12px;';
      panel.innerHTML=`
        <h2>Nouveau mot de passe</h2>
        <p>Choisis ton nouveau mot de passe.</p>
        <form id="new-password-form" style="display:flex;flex-direction:column;gap:12px;width:min(100%,350px)">
          <input id="new-password" type="password" placeholder="Nouveau mot de passe" minlength="6" required>
          <input id="confirm-password" type="password" placeholder="Confirmer le mot de passe" minlength="6" required>
          <button type="button" id="toggle-password">👁 Afficher les mots de passe</button>
          <button type="submit">Enregistrer mon mot de passe</button>
          <p id="password-message"></p>
        </form>`;
      document.body.appendChild(panel);

      document.getElementById('toggle-password').onclick=()=>{
        const a=document.getElementById('new-password');
        const b=document.getElementById('confirm-password');
        const visible=a.type==='password';
        a.type=visible?'text':'password';
        b.type=visible?'text':'password';
        document.getElementById('toggle-password').textContent=visible?'Masquer les mots de passe':'👁 Afficher les mots de passe';
      };

      document.getElementById('new-password-form').onsubmit=async e=>{
        e.preventDefault();
        const password=document.getElementById('new-password').value;
        const confirmation=document.getElementById('confirm-password').value;
        const msg=document.getElementById('password-message');

        if(password.length<6){
          msg.textContent='6 caractères minimum.';
          return;
        }
        if(password!==confirmation){
          msg.textContent='Les deux mots de passe ne correspondent pas.';
          return;
        }

        const {error}=await supabase.auth.updateUser({password});
        if(error){
          msg.textContent='Erreur : '+error.message;
          return;
        }

        msg.textContent='Mot de passe modifié !';
        await supabase.auth.signOut();
        currentUser=null;
        recoveryMode=false;
        panel.remove();
        setMode('login');
        show('auth');
      };
    }
    panel.style.display='flex';
    show('auth');
  }

  supabase.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){
      recoveryMode=true;
      currentUser=session?.user||null;
      showRecoveryForm();
      return;
    }
    if(session&&!currentUser&&!recoveryMode){
      enterApp(session.user);
    }
  });

  const {data:{session}}=await supabase.auth.getSession();

  if(!recoveryMode){
    if(session) await enterApp(session.user);
    else show('auth');
  }
})();
        })();
