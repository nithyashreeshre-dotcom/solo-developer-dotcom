// nav.js — shared navbar + footer injected on every page
(function () {
  const PATH = window.location.pathname;
  const PAGE = PATH.split('/').pop() || 'index.html';
  const inPages = PATH.includes('/pages/');

  // Prefix for links depending on where we are
  const root  = inPages ? '../' : '';       // root-level files
  const pages = inPages ? ''    : 'pages/'; // pages/ folder files

  function isActive(page) {
    return PAGE === page ? 'active' : '';
  }

  const NAV_HTML = `
<div class="toast-container" id="toastContainer"></div>

<div class="announce-bar" id="announceBar">
  <span style="opacity:0.6">//</span> BETA — Solo Developer is now open to everyone —
  <a href="#" onclick="openModal('signupModal');return false;">Create your free account</a> and start publishing today.
  <button class="announce-close" onclick="document.getElementById('announceBar').remove()">✕</button>
</div>

<nav>
  <div class="nav-inner">
    <a href="${root}index.html" class="logo">
      <div class="logo-mark">SD</div>
      Solo<span>dev</span>
    </a>
    <div class="nav-links">
      <a href="${root}index.html"        class="nav-link ${isActive('index.html')}">Browse</a>
      <a href="${root}top-rated.html"    class="nav-link ${isActive('top-rated.html')}">Top Rated</a>
      <a href="${root}new-trending.html" class="nav-link ${isActive('new-trending.html')}">New &amp; Trending</a>
      <a href="${root}free.html"         class="nav-link ${isActive('free.html')}">Free</a>
      <a href="${root}creators.html"     class="nav-link ${isActive('creators.html')}">Creators</a>
      <a href="${root}devlogs.html"      class="nav-link ${isActive('devlogs.html')}">Devlogs</a>
    </div>
    <div class="nav-search-wrap">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" id="globalSearch" placeholder="Search games, apps, creators…" autocomplete="off" oninput="handleSearch(this.value)" onfocus="openSearchDrop()" onblur="closeSearchDrop()">
      <div class="search-results-dropdown" id="searchDrop"></div>
    </div>
    <div class="nav-actions">
      <div style="position:relative;">
        <button class="btn-icon" onclick="toggleNotifPanel()" id="notifBtn" style="position:relative;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="notif-unread-badge" id="notifBadge" style="display:none;">0</span>
        </button>
        <div class="notif-panel" id="notifPanel">
          <div class="notif-panel-hd">
            <h4>Notifications</h4>
            <button class="notif-mark-read" onclick="markAllRead()">Mark all read</button>
          </div>
          <div id="notifList">
            <div class="notif-empty">You're all caught up ✓</div>
          </div>
        </div>
      </div>
      <div id="navAuthButtons" style="display:flex;align-items:center;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="openModal('loginModal')">Log in</button>
        <button class="btn btn-primary btn-sm" onclick="openModal('uploadModal')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
          Upload Game
        </button>
      </div>
      <div id="navUserSection" style="display:none; position:relative;">
        <div class="nav-user-avatar" id="navAvatar" onclick="toggleUserMenu()">?</div>
        <div class="nav-user-menu" id="navUserMenu">
          <div class="nav-user-menu-header">
            <div class="nav-user-menu-name" id="menuDisplayName">—</div>
            <div class="nav-user-menu-email" id="menuEmail">—</div>
          </div>
          <div class="nav-user-menu-item" onclick="openModal('uploadModal'); toggleUserMenu();">
            <span>⬆️</span> Publish a project
          </div>
          <div class="nav-user-menu-item" onclick="openDashboard(); toggleUserMenu();">
            <span>📊</span> My dashboard
          </div>
          <div class="nav-user-menu-item" onclick="openDashboard('dProfile'); toggleUserMenu();">
            <span>👤</span> Profile
          </div>
          <div class="nav-user-menu-item" id="adminNavBtn" style="display:none;" onclick="openAdminPanel(); toggleUserMenu();">
            <span>🛡</span> Admin Panel
          </div>
          <div class="nav-user-menu-item danger" onclick="signOut()">
            <span>🚪</span> Sign out
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>`;

  const FOOTER_HTML = `
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="logo" style="margin-bottom:0.75rem;">
        <div class="logo-mark">SD</div>
        Solo<span style="color:var(--accent);">dev</span>
      </div>
      <p class="footer-tagline">An open platform for indie creators. Publish games, apps, videos, photos, and posts. Powered by Firebase + Cloudinary.</p>
      <div class="footer-social">
        <a href="#" class="social-icon" onclick="showToast('Twitter/X coming soon!','info');return false;" title="Twitter/X">𝕏</a>
        <a href="#" class="social-icon" onclick="showToast('Discord coming soon!','info');return false;" title="Discord">💬</a>
        <a href="#" class="social-icon" onclick="showToast('GitHub coming soon!','info');return false;" title="GitHub">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
        </a>
      </div>
    </div>
    <div class="footer-col">
      <h5>Discover</h5>
      <a href="${root}index.html">Browse Games</a>
      <a href="${root}index.html">Browse Apps</a>
      <a href="${root}index.html">Browse Videos</a>
      <a href="${root}index.html">Browse Photos</a>
      <a href="${root}devlogs.html">Read Devlogs</a>
      <a href="${root}new-trending.html">New Releases</a>
    </div>
    <div class="footer-col">
      <h5>Create</h5>
      <a href="#" onclick="openModal('uploadModal');return false;">Publish a project</a>
      <a href="#" onclick="openModal('signupModal');return false;">Creator account</a>
      <a href="${pages}dashboard.html">Creator dashboard</a>
      <a href="${pages}analytics.html">Analytics</a>
      <a href="${pages}monetization.html">Monetization</a>
      <a href="${pages}creator-faq.html">Creator FAQ</a>
    </div>
    <div class="footer-col">
      <h5>Community</h5>
      <a href="${root}creators.html">Spotlight creators</a>
      <a href="${pages}game-jams.html">Game jams</a>
      <a href="${pages}discord.html">Discord server</a>
      <a href="${pages}newsletter.html">Weekly digest</a>
      <a href="${root}creators.html">Creator stories</a>
      <a href="${pages}forums.html">Forums</a>
    </div>
    <div class="footer-col">
      <h5>Company</h5>
      <a href="${pages}about.html">About</a>
      <a href="${pages}blog.html">Blog</a>
      <a href="${pages}roadmap.html">Roadmap</a>
      <a href="${pages}press.html">Press kit</a>
      <a href="${pages}contact.html">Contact</a>
      <a href="${pages}status.html">Status</a>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-bottom-left">© 2025 Solo Developer · All rights reserved</div>
    <div class="footer-bottom-right">
      <a href="${pages}privacy.html">Privacy Policy</a>
      <a href="${pages}terms.html">Terms of Service</a>
      <a href="${pages}cookies.html">Cookie Policy</a>
      <a href="${pages}accessibility.html">Accessibility</a>
    </div>
    <div class="made-by">Made with <span>♥</span> by Shreevatsa · Bengaluru, India</div>
  </div>
</footer>
<button class="back-top" id="backTop" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Back to top">↑</button>`;

  document.body.insertAdjacentHTML('afterbegin', NAV_HTML);
  document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
})();
