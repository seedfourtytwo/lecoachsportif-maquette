(function(){
  var root = document.documentElement;
  var order = ['system', 'light', 'dark'];
  var names = { system: 'Thème auto', light: 'Thème clair', dark: 'Thème sombre' };
  var cyclers = document.querySelectorAll('[data-theme-cycle]');

  function current(){ return root.dataset.theme || 'system'; }
  function paint(){
    cyclers.forEach(function(b){
      b.setAttribute('aria-label', names[current()] + ', changer');
      b.title = names[current()];
      b.querySelector('.theme-label').textContent = names[current()];
      b.querySelectorAll('svg').forEach(function(i){ i.toggleAttribute('hidden', i.dataset.icon !== current()); });
    });
  }
  cyclers.forEach(function(b){
    b.addEventListener('click', function(){
      var next = order[(order.indexOf(current()) + 1) % order.length];
      if (next === 'system') { delete root.dataset.theme; } else { root.dataset.theme = next; }
      try {
        if (next === 'system') { localStorage.removeItem('theme'); } else { localStorage.setItem('theme', next); }
      } catch (e) {}
      paint();
    });
  });
  paint();

  /* Menu plein écran */
  var menu = document.getElementById('menu');
  document.getElementById('menuOpen').addEventListener('click', function(){ menu.showModal(); });
  document.getElementById('menuClose').addEventListener('click', function(){ menu.close(); });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.close(); }); });

  /* Ce qui suit ne concerne que la page d'accueil. */
  var slots = document.getElementById('slots');
  if (!slots) return;

  /* Lien du menu correspondant à la section affichée */
  var links = document.querySelectorAll('.nav-links a[href^="#"]');
  var spy = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      links.forEach(function(l){ l.setAttribute('aria-current', l.hash === '#' + entry.target.id ? 'true' : 'false'); });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  links.forEach(function(l){ var s = document.querySelector(l.hash); if (s) spy.observe(s); });

  /* Barre de réservation : visible quand ni le bouton d'accueil ni l'agenda ne sont à l'écran */
  var dock = document.getElementById('dock');
  var seen = new Set();
  var dockWatch = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){ if (entry.isIntersecting) { seen.add(entry.target); } else { seen.delete(entry.target); } });
    dock.classList.toggle('show', seen.size === 0);
  });
  dockWatch.observe(document.getElementById('heroBook'));
  dockWatch.observe(document.getElementById('reserver'));

  /* L'agenda Calendly se charge dans la page, à l'approche de la section de réservation.
     Le message d'attente reste affiché jusqu'à la première réponse de Calendly, puis le cadre suit la hauteur annoncée. */
  var slotWatch = new IntersectionObserver(function(entries){
    if (!entries[0].isIntersecting) return;
    slotWatch.disconnect();
    var frame = document.createElement('iframe');
    frame.title = 'Choisir un créneau pour le bilan offert';
    frame.src = 'https://calendly.com/personaltrainermycoachmickael/bilan-forme-offert'
      + '?embed_type=Inline&embed_domain=' + encodeURIComponent(location.hostname)
      + '&hide_gdpr_banner=1&hide_event_type_details=1';
    slots.append(frame);
    window.addEventListener('message', function(e){
      if (e.origin !== 'https://calendly.com' || e.source !== frame.contentWindow || !e.data) return;
      if (!slots.classList.contains('loaded')) {
        slots.classList.add('loaded');
        slots.querySelector('p').remove();
      }
      var height = e.data.event === 'calendly.page_height' && e.data.payload && parseInt(e.data.payload.height, 10);
      if (height) frame.style.height = height + 'px';
      if (e.data.event === 'calendly.date_and_time_selected' || e.data.event === 'calendly.event_scheduled') {
        slots.scrollIntoView({ block: 'start' });
      }
    });
  }, { rootMargin: '600px' });
  slotWatch.observe(slots);

  /* Les deux « En savoir plus » s'ouvrent et se ferment ensemble, pour comparer les formules ligne à ligne. */
  var details = document.querySelectorAll('.offer .more');
  details.forEach(function(d){
    d.addEventListener('toggle', function(){
      details.forEach(function(other){ other.open = d.open; });
    });
  });

  /* Maquette : les formulaires ne sont pas branchés. */
  document.querySelectorAll('form').forEach(function(f){
    f.addEventListener('submit', function(e){ e.preventDefault(); });
  });
})();
