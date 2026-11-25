const $ = s => document.querySelector(s);
let active = 'renfo', activeDay = 1;
const order = [7,2,19,11,4,23,1,15,9,21,5,17,13,25,6,20,3,16,10,24,8,14,22,12,18];
const key = c => 'avent-progress-' + c;
function done(c) { try { return JSON.parse(localStorage.getItem(key(c)) || '[]'); } catch { return []; } }
function show(id) { ['home','calendar','detail'].forEach(x => $('#'+x).classList.toggle('hidden', x !== id)); }
function addLink(parent, url, label) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = label;
  a.className = 'video-link';
  parent.appendChild(a);
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
    b.disabled = locked;
    b.setAttribute('aria-label', 'Case ' + n + (locked ? ', verrouillée' : isDone ? ', terminée' : ', à découvrir'));
    b.onclick = () => openDay(n);
    $('#days').appendChild(b);
  });
  show('calendar');
}
function openDay(n) {
  activeDay = n;
  const x = CALENDAR_DATA[active][n-1];
  $('#day-title').textContent = 'Case ' + n + ' – ' + x.title;
  $('#day-details').textContent = x.details || '';
  $('#day-rounds').textContent = x.rounds || '';
  const old = $('#exercise-help');
  if (old) old.remove();
  const box = document.createElement('div');
  box.id = 'exercise-help';
  box.className = 'exercise-help';
  if (x.explanation) {
    const p = document.createElement('p');
    p.textContent = x.explanation;
    box.appendChild(p);
  }
  if (Array.isArray(x.exercises) && x.exercises.length) {
    const heading = document.createElement('p');
    heading.textContent = 'Exercices :';
    box.appendChild(heading);
    const list = document.createElement('ul');
    x.exercises.forEach(ex => {
      const li = document.createElement('li');
      if (ex.url) addLink(li, ex.url, ex.name);
      else li.textContent = ex.name;
      list.appendChild(li);
    });
    box.appendChild(list);
  }
  if (x.video) addLink(box, x.video, '▶ Voir la vidéo de démonstration');
  if (x.music) addLink(box, x.music, '♫ Écouter la musique');
  if (box.childNodes.length) $('#day-rounds').insertAdjacentElement('afterend', box);
  const finished = done(active).includes(n);
  $('#complete').disabled = finished;
  $('#complete').textContent = finished ? 'Défi déjà réalisé ✓' : 'Défi réalisé ! ✓';
  show('detail');
}
document.querySelectorAll('[data-calendar]').forEach(b => b.onclick = () => render(b.dataset.calendar));
$('#back').onclick = () => show('home');
$('#detail-back').onclick = () => render(active);
$('#complete').onclick = () => {
  const a = done(active);
  if (!a.includes(activeDay)) {
    a.push(activeDay);
    a.sort((x,y) => x-y);
    localStorage.setItem(key(active), JSON.stringify(a));
  }
  render(active);
};
