const $ = s => document.querySelector(s);
let active = 'renfo', activeDay = 1;
const order = Array.from({length:25}, (_, i) => i + 1);
const key = c => 'avent-progress-' + c;
function done(c) { try { return JSON.parse(localStorage.getItem(key(c)) || '[]'); } catch { return []; } }
function show(id) { ['home','calendar','detail'].forEach(x => $('#'+x).classList.toggle('hidden', x !== id)); }
function makeLink(label, url) {
  if (!url) return null;
  const a = document.createElement('a'); a.href = url; a.target = '_blank';
  a.rel = 'noopener noreferrer'; a.textContent = label; a.className = 'video-link'; return a;
}
function render(c) {
  active = c;
  $('#calendar-title').textContent = c.toUpperCase();
  $('#calendar-subtitle').textContent = c === 'renfo' ? '25 défis de renforcement musculaire' : '25 séances Tabata';
  const completed = done(c), unlockedCount = Math.min(order.length, completed.length + 1);
  $('#progress-fill').style.width = (completed.length / 25 * 100) + '%';
  $('#progress-label').textContent = completed.length + ' / 25 défis réalisés';
  $('#days').innerHTML = '';
  order.forEach((n, i) => {
    const b = document.createElement('button');
    const isDone = completed.includes(n), locked = i >= unlockedCount && !isDone;
    b.className = 'day' + (isDone ? ' done' : '') + (locked ? ' locked' : '');
    b.innerHTML = '<span class="day-number">' + n + '</span>' + (locked ? '<span class="day-lock">🔒</span>' : '');
    b.disabled = locked; b.setAttribute('aria-label', 'Case ' + n + (locked ? ', verrouillée' : isDone ? ', terminée' : ', à découvrir'));
    b.onclick = () => openDay(n); $('#days').appendChild(b);
  });
  show('calendar');
}
function openDay(n) {
  activeDay = n; const x = CALENDAR_DATA[active][n-1];
  $('#day-title').textContent = 'Case ' + n + ' – ' + x.title;
  $('#day-details').textContent = x.details || '';
  const oldPhoto = $('#day-photo'); if (oldPhoto) oldPhoto.remove();
  if (x.image) { const img = document.createElement('img'); img.id='day-photo'; img.src=x.image; img.alt='Illustration de coach devant le sapin de Noël'; img.className='day-photo'; $('#day-details').insertAdjacentElement('afterend',img); }
  $('#day-rounds').textContent = x.rounds || '';
  const old = $('#exercise-help'); if (old) old.remove();
  const box = document.createElement('div'); box.id='exercise-help'; box.className='exercise-help';
  if (x.explanation) { const p=document.createElement('p'); p.className='coach-message'; p.textContent=x.explanation; box.appendChild(p); }
  if (x.video) box.appendChild(makeLink('▶ Voir la vidéo de démonstration',x.video));
  if (x.music) { const p=document.createElement('p'); p.className='link-heading'; p.textContent='Musique'; box.appendChild(p); box.appendChild(makeLink('♫ Écouter la musique',x.music)); }
  if (x.exercises && x.exercises.length) { const h=document.createElement('p'); h.className='link-heading'; h.textContent='Vidéos des exercices'; box.appendChild(h); const ul=document.createElement('ul'); ul.className='exercise-links'; x.exercises.forEach(e=>{const li=document.createElement('li'); li.appendChild(makeLink('▶ '+e.name,e.url)); ul.appendChild(li);}); box.appendChild(ul); }
  if (box.children.length) $('#day-rounds').insertAdjacentElement('afterend',box);
  const finished=done(active).includes(n); $('#complete').disabled=finished; $('#complete').textContent=finished?'Défi déjà réalisé ✓':'Défi réalisé ! ✓'; show('detail');
}
document.querySelectorAll('[data-calendar]').forEach(b=>b.onclick=()=>render(b.dataset.calendar));
$('#back').onclick=()=>show('home'); $('#detail-back').onclick=()=>render(active);
$('#complete').onclick=()=>{const a=done(active); if(!a.includes(activeDay)){a.push(activeDay);a.sort((x,y)=>x-y);localStorage.setItem(key(active),JSON.stringify(a));} render(active);};
