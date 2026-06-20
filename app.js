window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window._fb) {
      window._fb.loadProjects('all');
      window._fb.updateCounters();
    }
  }, 800);
});

function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { info:'ℹ', success:'✓', error:'✕' };
  t.innerHTML = `<span>${icons[type]||'ℹ'}</span> ${msg}`;
  c.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
}

function logAnalyticsEvent(name, params) {
  if (window._fb) window._fb.logEvent?.(name, params);
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
  if (id === 'uploadModal' && window._fb && !window._fb.currentUser()) {
    document.getElementById('publishAuthWarning').style.display = 'block';
  }
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
document.querySelectorAll('.overlay').forEach(o => {
  o.addEventListener('click', e => {
    if (e.target === o) { o.classList.remove('open'); document.body.style.overflow = ''; }
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.open').forEach(o => { o.classList.remove('open'); document.body.style.overflow = ''; });
  }
});

let activeAuthMode = 'signin';
function switchAuthTab(btn, panel) {
  activeAuthMode = panel;
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.modal-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panel + 'Panel').classList.add('active');
  document.getElementById('authBtn').querySelector('.btn-label').textContent =
    panel === 'signin' ? 'Sign In' : 'Create Account';
  document.getElementById('authModalTitle').textContent =
    panel === 'signin' ? 'Welcome Back' : 'Create Your Account';
  const errEl = document.getElementById('loginError');
  if (errEl) errEl.classList.remove('show');
}

function signInWithGoogle() { if (window._fb) window._fb.signInWithGoogle(); }
function handleAuth() {
  if (!window._fb) return;
  if (activeAuthMode === 'signin') {
    window._fb.signIn(document.getElementById('loginEmail').value.trim(), document.getElementById('loginPassword').value);
  } else {
    window._fb.signUp(
      document.getElementById('signupEmail').value.trim(),
      document.getElementById('signupPassword').value,
      document.getElementById('signupName').value.trim(),
      document.getElementById('signupUsername').value.trim(),
      document.getElementById('signupFocus').value
    );
  }
}
function handleHeroSignup() {
  if (!window._fb) return;
  window._fb.heroSignUp(
    document.getElementById('heroSignupEmail').value.trim(),
    document.getElementById('heroSignupPassword').value,
    document.getElementById('heroSignupName').value.trim(),
    document.getElementById('heroSignupUsername').value.trim()
  );
}
function sendPasswordReset() {
  const email = document.getElementById('loginEmail').value.trim();
  if (!email) { showToast('Enter your email above first', 'error'); return; }
  if (window._fb) window._fb.sendPasswordReset(email);
}
function signOut() { if (window._fb) window._fb.signOut(); toggleUserMenu(); }

function toggleUserMenu() { document.getElementById('navUserMenu').classList.toggle('open'); }
document.addEventListener('click', (e) => {
  const menu   = document.getElementById('navUserMenu');
  const avatar = document.getElementById('navAvatar');
  if (menu && !menu.contains(e.target) && e.target !== avatar) menu.classList.remove('open');
});

function switchTab(btn, type) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#mainGrid .firestore-card').forEach(c => c.remove());
  const grid = document.getElementById('mainGrid');
  const sk = document.createElement('div');
  sk.id = 'skeletonCard';
  sk.className = 'card skeleton-card';
  sk.style.cssText = 'opacity:0.4;pointer-events:none;';
  sk.innerHTML = `<div class="card-thumb"><div class="card-thumb-bg" style="background:var(--surface2);">⏳</div></div><div class="card-body"><div class="card-title" style="color:var(--text3);font-family:var(--font-mono);">// Loading…</div></div>`;
  grid.prepend(sk);
  const typeMap = { games:'Game', apps:'App / Tool', videos:'Video', photos:'Photo / Art', posts:'Post' };
  const fsType = typeMap[type] || 'all';
  document.querySelectorAll('#mainGrid .static-card').forEach(c => {
    c.style.display = (type === 'all') ? '' : 'none';
  });
  if (window._fb) window._fb.loadProjects(fsType);
}

/* Top nav links: Browse / Top Rated / New & Trending / Free / Creators / Devlogs */
function setActiveNavLink(el) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (el) el.classList.add('active');
}

function runDiscoverFilter(filterType, showStaticCards) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  const allTabBtn = document.querySelector('.tab-btn[onclick*="\'all\'"]');
  if (filterType === 'all' && allTabBtn) allTabBtn.classList.add('active');
  document.querySelectorAll('#mainGrid .firestore-card').forEach(c => c.remove());
  const grid = document.getElementById('mainGrid');
  const sk = document.createElement('div');
  sk.id = 'skeletonCard';
  sk.className = 'card skeleton-card';
  sk.style.cssText = 'opacity:0.4;pointer-events:none;';
  sk.innerHTML = `<div class="card-thumb"><div class="card-thumb-bg" style="background:var(--surface2);">⏳</div></div><div class="card-body"><div class="card-title" style="color:var(--text3);font-family:var(--font-mono);">// Loading…</div></div>`;
  grid.prepend(sk);
  document.querySelectorAll('#mainGrid .static-card').forEach(c => {
    c.style.display = showStaticCards ? '' : 'none';
  });
  if (window._fb) window._fb.loadProjects(filterType);
}

function navGoBrowse(el) {
  setActiveNavLink(el);
  runDiscoverFilter('all', true);
}

function navGoNewTrending(el) {
  setActiveNavLink(el);
  runDiscoverFilter('all', true); // newest first is already the default sort
}

function navGoTopRated(el) {
  setActiveNavLink(el);
  runDiscoverFilter('top-rated', false);
}

function navGoFree(el) {
  setActiveNavLink(el);
  runDiscoverFilter('free', false);
}

function navGoSection(el, sectionId) {
  setActiveNavLink(el);
  const target = document.getElementById(sectionId);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleChip(el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}
function filterByType(type) {
  document.getElementById('discover').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    document.querySelectorAll('.tab-btn').forEach(t => {
      if (t.textContent.toLowerCase().includes(type.slice(0,4))) {
        document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
      }
    });
    showToast(`Filtered by: ${type}`, 'info');
  }, 400);
}

function setView(mode, btn) {
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const grid = document.getElementById('mainGrid');
  if (mode === 'list') {
    grid.className = 'grid-list';
    grid.querySelectorAll('.card').forEach(c => { c.style.flexDirection='row'; c.style.alignItems='center'; });
  } else {
    grid.className = 'grid-4';
    grid.querySelectorAll('.card').forEach(c => { c.style.flexDirection=''; c.style.alignItems=''; });
  }
}

function selType(el) {
  document.querySelectorAll('.type-opt').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
}
function selPricingTab(btn, mode) {
  document.querySelectorAll('.pricing-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('priceInput').style.display = (mode === 'paid') ? 'block' : 'none';
}

function dragOver(e)  { e.preventDefault(); document.getElementById('dropzone').classList.add('dragging'); }
function dragLeave(e) { document.getElementById('dropzone').classList.remove('dragging'); }
function dropFile(e)  {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file && window._fb) window._fb.uploadFile(file);
}
function fileSelected(input) { if (input.files[0] && window._fb) window._fb.uploadFile(input.files[0]); }

function publishProject() {
  if (!window._fb) return;
  window._fb.publishProject(
    document.getElementById('pubTitle').value.trim(),
    document.getElementById('pubTagline').value.trim(),
    document.getElementById('pubDesc').value.trim(),
    document.getElementById('pubTags').value.trim(),
    document.getElementById('pubLink').value.trim(),
    document.getElementById('pubPlatform').value,
    document.getElementById('pubRating').value,
    document.querySelector('.pricing-tab.active')?.textContent || 'Free'
  );
}
function saveDraftToFirestore() {
  if (!window._fb) return;
  window._fb.saveDraft(document.getElementById('pubTitle').value.trim(), document.getElementById('pubDesc').value.trim());
}

function saveItem(btn, name) {
  btn.textContent = '🔖';
  showToast(`"${name}" saved to your collection`, 'success');
}
function toggleFollow(btn) {
  const isFollowing = btn.classList.toggle('following');
  btn.textContent = isFollowing ? 'Following ✓' : 'Follow';
  showToast(isFollowing ? "Now following!" : 'Unfollowed.', isFollowing ? 'success' : 'info');
}
function shareItem(name) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).then(() => showToast(`Link to "${name}" copied!`, 'success'));
  } else {
    showToast('Link copied!', 'success');
  }
}

function loadMore() {
  const btn = document.getElementById('loadMoreBtn');
  btn.textContent = 'Loading…'; btn.disabled = true;
  setTimeout(() => {
    const grid = document.getElementById('mainGrid');
    const cards = [
      { bg:'linear-gradient(135deg,#1a1200,#3d2e00)', icon:'⚔️', type:'Game', tc:'tb-game', title:'Dungeon Crawl: Reborn', desc:'Turn-based dungeon crawler with procedural levels and a dark fantasy aesthetic.', tags:['Browser','Turn-based','Free'], meta:'🖥 Browser', price:'Free', act:'Play' },
      { bg:'linear-gradient(135deg,#0d1b2a,#1b4f72)', icon:'🌊', type:'App', tc:'tb-app', title:'WaveSync Audio Player', desc:'Minimal desktop audio player with BPM detection and waveform visualization.', tags:['Electron','Audio','Open source'], meta:'🖥 Desktop', price:'Free', act:'Download' },
      { bg:'linear-gradient(135deg,#1a0a3e,#3d1a6e)', icon:'🎨', type:'Photo', tc:'tb-photo', title:'Neon Cityscapes — Night Series', desc:'Long-exposure night photography shot in Bengaluru. High-res wallpaper pack included.', tags:['Photography','Night','Wallpapers'], meta:'📷 Gallery', price:'Free', act:'View' },
    ];
    cards.forEach(c => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `
        <div class="card-thumb">
          <div class="card-thumb-bg" style="background:${c.bg};">${c.icon}</div>
          <span class="type-badge ${c.tc}">${c.type}</span>
          <button class="card-save-btn" onclick="saveItem(this,'${c.title}')" title="Save">🔖</button>
        </div>
        <div class="card-body">
          <div class="card-title">${c.title}</div>
          <div class="card-desc">${c.desc}</div>
          <div class="card-tags">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        </div>
        <div class="card-footer">
          <div class="card-meta"><span class="meta-item">${c.meta}</span><span class="meta-item">${c.price}</span></div>
          <button class="card-btn" onclick="showToast('Opening project…','info')">${c.act} →</button>
        </div>`;
      grid.appendChild(el);
    });
    btn.textContent = 'Load more projects ↓'; btn.disabled = false;
    showToast('3 more projects loaded!', 'success');
  }, 900);
}

const searchData = [
  {title:'Run From Epsteins',type:'Game',icon:'🌲'},
  {title:'Void Wanderer',type:'Game',icon:'🚀'},
  {title:'FocusForest',type:'App',icon:'🌿'},
  {title:'GridLock Puzzle',type:'Game',icon:'🧩'},
  {title:'DevPad',type:'App',icon:'🔧'},
  {title:'Urban Decay Series',type:'Photo',icon:'📷'},
  {title:'Ambient Forest Sound Pack',type:'Audio',icon:'🎵'},
  {title:'Pixel Ruins Tileset',type:'Art',icon:'🏺'},
  {title:'Shreevatsa',type:'Creator',icon:'👤'},
  {title:'ArjunKodes',type:'Creator',icon:'👤'},
];
let searchTimeout;
function handleSearch(val) {
  clearTimeout(searchTimeout);
  if (!val.trim()) { closeSearchDrop(); return; }
  searchTimeout = setTimeout(() => {
    const q = val.toLowerCase();
    const results = searchData.filter(d => d.title.toLowerCase().includes(q));
    const drop = document.getElementById('searchDrop');
    if (!results.length) {
      drop.innerHTML = `<div class="search-empty">// No results for "${val}"</div>`;
    } else {
      drop.innerHTML = results.map(r => `
        <div class="search-result-item" onclick="showToast('Opening ${r.title}…','info')">
          <div class="search-result-icon">${r.icon}</div>
          <div class="search-result-meta">
            <div class="search-result-title">${r.title}</div>
            <div class="search-result-sub">${r.type}</div>
          </div>
        </div>`).join('');
    }
    drop.classList.add('open');
  }, 180);
}
function openSearchDrop()  { if (document.getElementById('globalSearch').value) document.getElementById('searchDrop').classList.add('open'); }
function closeSearchDrop() { setTimeout(() => document.getElementById('searchDrop').classList.remove('open'), 200); }

function subscribeNewsletter() {
  const email = document.getElementById('nlEmail').value.trim();
  if (!email || !email.includes('@')) { showToast('Please enter a valid email address', 'error'); return; }
  if (window._fb) {
    window._fb.subscribeNewsletter(email);
  } else {
    showToast('Subscribed!', 'success');
  }
  document.getElementById('nlEmail').value = '';
}

window.addEventListener('load', () => {
  if (!localStorage.getItem('sd_cookie')) {
    setTimeout(() => document.getElementById('cookieBanner').classList.add('show'), 2000);
  }
});
function acceptCookie()  { localStorage.setItem('sd_cookie','1'); document.getElementById('cookieBanner').classList.remove('show'); showToast('Preferences saved','success'); }
function dismissCookie() { document.getElementById('cookieBanner').classList.remove('show'); }

window.addEventListener('scroll', () => {
  document.getElementById('backTop').classList.toggle('visible', window.scrollY > 400);
});

function animateCounter(id, target, suffix='') {
  const el = document.getElementById(id);
  if (!el || !target) return;
  let start = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start).toLocaleString() + suffix;
  }, 25);
}

window._editingProject = {};
async function openEditModal(docId) {
  try {
    showToast('Loading project data…', 'info');
    const card  = document.querySelector(`[data-doc-id="${docId}"]`);
    const title = card?.querySelector('.card-title')?.textContent || '';
    const desc  = card?.querySelector('.card-desc')?.textContent || '';
    document.getElementById('editDocId').value   = docId;
    document.getElementById('editTitle').value   = title;
    document.getElementById('editDesc').value    = desc;
    document.getElementById('editTags').value    = '';
    document.getElementById('editTagline').value = '';
    document.getElementById('editLink').value    = '';
    openModal('editModal');
  } catch (err) {
    showToast('Could not load project: ' + err.message, 'error');
  }
}

function saveEdit() {
  const docId = document.getElementById('editDocId').value;
  if (!docId) return;
  const btn = document.getElementById('editSaveBtn');
  btn.classList.add('loading');
  const updates = {
    title:       document.getElementById('editTitle').value.trim(),
    description: document.getElementById('editDesc').value.trim(),
    tagline:     document.getElementById('editTagline').value.trim(),
    tags:        document.getElementById('editTags').value.split(',').map(t=>t.trim()).filter(Boolean),
    externalLink:document.getElementById('editLink').value.trim(),
    platform:    document.getElementById('editPlatform').value,
    pricing:     document.getElementById('editPricing').value,
  };
  if (!updates.title) { showToast('Title is required', 'error'); btn.classList.remove('loading'); return; }
  window._fb.updateProject(docId, updates).then(() => {
    btn.classList.remove('loading');
    closeModal('editModal');
  }).catch(() => btn.classList.remove('loading'));
}

function confirmDelete(docId, title) {
  if (confirm(`Delete "${title}"? This cannot be undone.`)) {
    window._fb.deleteProject(docId);
  }
}

/* Wire up static cards */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.static-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const title = card.querySelector('.card-title')?.textContent;
        showToast(`Opening "${title}"…`, 'info');
      });
    });
  }, 1500);
});
