// ── Firebase imports ──────────────────────────────────────────────────────
  import { initializeApp }                        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getAnalytics, logEvent }               from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
  import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    updateProfile,
    signOut as fbSignOut
  }                                               from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
  import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    getCountFromServer,
    onSnapshot,
    increment,
    updateDoc,
    deleteDoc
  }                                               from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  const firebaseConfig = {
    apiKey:            "AIzaSyDqP_AHwWLKrz1IvSi3uaZ9hbQua5RKMV0",
    authDomain:        "solo-developer-64d04.firebaseapp.com",
    projectId:         "solo-developer-64d04",
    storageBucket:     "solo-developer-64d04.firebasestorage.app",
    messagingSenderId: "666847721740",
    appId:             "1:666847721740:web:61fa7134c3da33dca5b129",
    measurementId:     "G-0W8T67MLKQ"
  };

  const app       = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const auth      = getAuth(app);
  const db        = getFirestore(app);
  window.db = db;
  window._fb = window._fb || {};
  window._fb.db = db;

  const gProvider = new GoogleAuthProvider();

  let uploadedFileURL = null;
  let currentUser     = null;
  window._uploadedFileURL = null;

  // ── Admin / owner control ───────────────────────────────────────────────
  // Put your own Firebase Auth UID(s) here. Find yours by signing in, then
  // opening the browser console and running: window._fb.currentUser().uid
  const ADMIN_UIDS = ["88Y7aAC2lNcsnXk2LoqtqLxwijS2"];
  function isAdminUser() {
    const u = currentUser;
    return !!(u && ADMIN_UIDS.includes(u.uid));
  }

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const navAuth    = document.getElementById('navAuthButtons');
    const navUser    = document.getElementById('navUserSection');
    const navAvatar  = document.getElementById('navAvatar');
    const menuName   = document.getElementById('menuDisplayName');
    const menuEmail  = document.getElementById('menuEmail');
    const pubWarn    = document.getElementById('publishAuthWarning');

    if (user) {
      navAuth.style.display  = 'none';
      navUser.style.display  = 'block';
      const initials = (user.displayName || user.email || '?').slice(0,2).toUpperCase();
      navAvatar.textContent  = initials;
      menuName.textContent   = user.displayName || 'Creator';
      menuEmail.textContent  = user.email;
      if (pubWarn) pubWarn.style.display = 'none';
      logEvent(analytics, 'user_session', { uid: user.uid });
    } else {
      navAuth.style.display  = 'flex';
      navUser.style.display  = 'none';
    }

    // Re-render the project grid whenever sign-in state changes so
    // owner/admin controls (Edit/Delete) reflect the current user.
    if (window._fb && window._fb.loadProjects) {
      document.querySelectorAll('#mainGrid .firestore-card').forEach(c => c.remove());
      window._fb.loadProjects(window._fb._currentFilter || 'all');
    }
  });

  window._fb = {
        isAdmin: isAdminUser,
        async loadProjects(filterType = 'all') {
      window._fb._currentFilter = filterType;
      const grid     = document.getElementById('mainGrid');
      const skeleton = document.getElementById('skeletonCard');
      try {
        let q;
        if (filterType === 'all') {
          q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(20));
        } else {
          q = query(collection(db, 'projects'), where('type', '==', filterType), limit(20));
        }
        const snapshot = await getDocs(q);
        if (skeleton) skeleton.remove();
        if (snapshot.empty) return;
        const typeMap = {
          'Game':        { cls: 'tb-game',  emoji: '🎮', meta: '🖥 Browser' },
          'App / Tool':  { cls: 'tb-app',   emoji: '📱', meta: '📱 App' },
          'Video':       { cls: 'tb-video', emoji: '🎬', meta: '▶ Video' },
          'Photo / Art': { cls: 'tb-photo', emoji: '📷', meta: '🎨 Art' },
          'Post':        { cls: 'tb-post',  emoji: '✏️', meta: '📝 Post' },
          'Music / Audio': { cls: 'tb-music', emoji: '🎵', meta: '🎵 Audio' },
        };
        const staticCards = grid.querySelectorAll('.static-card');
        snapshot.forEach((docSnap) => {
          const p       = docSnap.data();
          const info    = typeMap[p.type] || { cls: 'tb-app', emoji: '📦', meta: '— Project' };
          const initials= (p.authorName || '??').slice(0,2).toUpperCase();
          const tags    = (p.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
          const price   = p.pricing || 'Free';
          const thumb   = p.fileURL
            ? `<img src="${p.fileURL}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" onerror="this.remove();">
               <div class="card-thumb-bg" style="background:linear-gradient(135deg,#0f172a,#1e293b);">${info.emoji}</div>`
            : `<div class="card-thumb-bg" style="background:linear-gradient(135deg,#0f172a,#1e293b);">${info.emoji}</div>`;
          const docId   = docSnap.id;
          const isOwner = currentUser && currentUser.uid === p.authorId;
          const isAdmin = isAdminUser();
          const canDelete = isOwner || isAdmin;
          const card = document.createElement('div');
          card.className = 'card firestore-card';
          card.setAttribute('data-doc-id', docId);
          card.style.cursor = 'pointer';
          card.innerHTML = `
            <div class="card-thumb">
              ${thumb}
              <span class="type-badge ${info.cls}">${p.type || 'Project'}</span>
              <span class="corner-badge cb-new">New</span>
              <button class="card-save-btn" onclick="event.stopPropagation();saveItem(this,'${(p.title||'').replace(/'/g,"\'")}')">🔖</button>
            </div>
            <div class="card-body">
              <div class="card-author-row">
                <div class="card-author" onclick="event.stopPropagation();openCreatorProfile('${p.authorId || ''}','${(p.authorName||'Creator').replace(/'/g,"\'")}')">
                  <div class="avatar" style="background:var(--accent-dim);color:var(--accent);">${initials}</div>
                  <span class="author-name">@${p.authorName || 'Creator'}</span>
                </div>
                ${isOwner ? `<div style="display:flex;gap:4px;">
                  <button onclick="event.stopPropagation();openEditModal('${docId}')" style="font-size:0.6rem;padding:2px 7px;border:1px solid var(--border2);border-radius:3px;background:var(--surface2);color:var(--text3);cursor:pointer;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.04em;">Edit</button>
                  <button onclick="event.stopPropagation();confirmDelete('${docId}','${(p.title||'').replace(/'/g,"\'")}')" style="font-size:0.6rem;padding:2px 7px;border:1px solid rgba(239,68,68,0.3);border-radius:3px;background:var(--red-dim);color:var(--red);cursor:pointer;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.04em;">Del</button>
                </div>` : isAdmin ? `<div style="display:flex;gap:4px;">
                  <button onclick="event.stopPropagation();confirmDelete('${docId}','${(p.title||'').replace(/'/g,"\'")}')" style="font-size:0.6rem;padding:2px 7px;border:1px solid rgba(239,68,68,0.3);border-radius:3px;background:var(--red-dim);color:var(--red);cursor:pointer;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.04em;">Admin Del</button>
                </div>` : ''}
              </div>
              <div class="card-title">${escapeHtml(p.title || 'Untitled')}</div>
              <div class="card-desc">${escapeHtml((p.description || '').slice(0, 100))}${(p.description||'').length > 100 ? '…' : ''}</div>
              <div class="card-tags">${tags}</div>
            </div>
            <div class="card-footer">
              <div class="card-meta">
                <span class="meta-item">${info.meta}</span>
                <span class="meta-item">${price}</span>
              </div>
              ${p.externalLink
                ? `<a href="${p.externalLink}" target="_blank" class="card-btn" onclick="event.stopPropagation();">View →</a>`
                : `<button class="card-btn" onclick="event.stopPropagation();showToast('Opening project…','info')">View →</button>`
              }
            </div>`;
          card.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            openProjectPage(docId);
          });
          if (staticCards.length > 0) {
            grid.insertBefore(card, staticCards[0]);
          } else {
            grid.appendChild(card);
          }
        });
        logEvent(analytics, 'projects_loaded', { count: snapshot.size, filter: filterType });
      } catch (err) {
        console.error('Firestore load error:', err);
        if (skeleton) skeleton.remove();
      }
    },async deleteProject(docId) {
      if (!currentUser) { showToast('Not signed in', 'error'); return; }
      try {
        await deleteDoc(doc(db, 'projects', docId));
        showToast('Project deleted.', 'success');
        logEvent(analytics, 'project_delete', { docId });
        const card = document.querySelector(`[data-doc-id="${docId}"]`);
        if (card) card.remove();
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    },

    async updateProject(docId, updates) {
      if (!currentUser) { showToast('Not signed in', 'error'); return; }
      try {
        await updateDoc(doc(db, 'projects', docId), { ...updates, updatedAt: serverTimestamp() });
        showToast('Project updated! 🎉', 'success');
        logEvent(analytics, 'project_update', { docId });
        document.querySelectorAll('#mainGrid .firestore-card').forEach(c => c.remove());
        await window._fb.loadProjects('all');
      } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
      }
    },

    async updateCounters() {
      try {
        const [projectsSnap, usersSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'projects'), where('status','==','published'))),
          getCountFromServer(collection(db, 'users'))
        ]);
        const projectCount = projectsSnap.data().count;
        const userCount    = usersSnap.data().count;
        document.getElementById('pill-all').textContent = projectCount || '—';
        animateCounter('counterCreators', projectCount);
        animateCounter('counterProjects', userCount);
        animateCounter('counterDownloads', projectCount * 3);
        animateCounter('counterCountries', Math.min(userCount * 2, 180));
      } catch (err) {
        console.warn('Counter update failed silently:', err);
      }
    },

    async signInWithGoogle() {
      try {
        const result = await signInWithPopup(auth, gProvider);
        const user   = result.user;
        await setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName,
          email:       user.email,
          photoURL:    user.photoURL,
          updatedAt:   serverTimestamp()
        }, { merge: true });
        closeAllModals();
        showToast(`Welcome, ${user.displayName || 'creator'}! 🎉`, 'success');
        logEvent(analytics, 'login', { method: 'google' });
      } catch (err) {
        showAuthError(err.message);
      }
    },

    async signIn(email, password) {
      setAuthLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        closeAllModals();
        showToast('Signed in successfully!', 'success');
        logEvent(analytics, 'login', { method: 'email' });
      } catch (err) {
        showAuthError(friendlyAuthError(err.code));
      } finally {
        setAuthLoading(false);
      }
    },

    async signUp(email, password, displayName, username, focus) {
      setAuthLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await setDoc(doc(db, 'users', cred.user.uid), {
          displayName, username: username.replace(/^@/, ''), email, focus: focus || '', createdAt: serverTimestamp()
        });
        closeAllModals();
        showToast(`Account created! Welcome to Solo Developer 🎉`, 'success');
        logEvent(analytics, 'sign_up', { method: 'email' });
      } catch (err) {
        showAuthError(friendlyAuthError(err.code));
      } finally {
        setAuthLoading(false);
      }
    },

    async heroSignUp(email, password, displayName, username) {
      const btn = document.getElementById('heroSignupBtn');
      btn.classList.add('loading');
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await setDoc(doc(db, 'users', cred.user.uid), {
          displayName, username: username.replace(/^@/, ''), email, createdAt: serverTimestamp()
        });
        closeAllModals();
        showToast(`Welcome, ${displayName}! 🎉`, 'success');
        logEvent(analytics, 'sign_up', { method: 'email_hero' });
      } catch (err) {
        const errEl = document.getElementById('signupError');
        errEl.textContent = friendlyAuthError(err.code);
        errEl.classList.add('show');
      } finally {
        btn.classList.remove('loading');
      }
    },

    async sendPasswordReset(email) {
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Password reset email sent!', 'success');
      } catch (err) {
        showToast('Could not send reset email.', 'error');
      }
    },

    async signOut() {
      await fbSignOut(auth);
      showToast('Signed out. See you next time!', 'info');
      logEvent(analytics, 'logout');
    },

    async uploadFile(file) {
      if (!file) return;
      const CLOUD_NAME    = 'dil3ndnlq';
      const UPLOAD_PRESET = 'wxrxsgt5';
      const CHUNK_SIZE    = 20 * 1024 * 1024;
      const prog   = document.getElementById('uploadProgress');
      const bar    = document.getElementById('progressBar');
      const nameEl = document.getElementById('uploadFilename');
      const infoEl = document.getElementById('uploadInfo');
      prog.style.display = 'block';
      nameEl.textContent = `// Uploading: ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)`;
      bar.style.width    = '0%';
      infoEl.classList.remove('show');
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB <= 90) {
        return new Promise((resolve) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', UPLOAD_PRESET);
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) bar.style.width = ((e.loaded / e.total) * 100) + '%';
          });
          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              const res = JSON.parse(xhr.responseText);
              uploadedFileURL = res.secure_url;
              window._uploadedFileURL = res.secure_url;
              nameEl.textContent = `✓ ${file.name} — ready`;
              infoEl.textContent = `// ✓ Uploaded to Cloudinary · ${sizeMB.toFixed(1)} MB · Free storage`;
              infoEl.classList.add('show');
              showToast('File uploaded successfully!', 'success');
              logEvent(analytics, 'file_upload', { name: file.name, size: file.size, provider: 'cloudinary' });
              resolve(res.secure_url);
            } else {
              const err = JSON.parse(xhr.responseText);
              showToast('Upload failed: ' + (err.error?.message || 'Unknown error'), 'error');
              prog.style.display = 'none';
              resolve(null);
            }
          });
          xhr.addEventListener('error', () => {
            showToast('Upload error. Check your connection.', 'error');
            prog.style.display = 'none';
            resolve(null);
          });
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
          xhr.send(formData);
        });
      }
      nameEl.textContent = `// Uploading: ${file.name} in chunks…`;
      const totalChunks  = Math.ceil(file.size / CHUNK_SIZE);
      const uniqueId     = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end   = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('upload_preset', UPLOAD_PRESET);
        const result = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const chunkPct  = e.loaded / e.total;
              const totalPct  = ((i + chunkPct) / totalChunks) * 100;
              bar.style.width = totalPct + '%';
              nameEl.textContent = `// Uploading chunk ${i+1}/${totalChunks} · ${totalPct.toFixed(0)}%`;
            }
          });
          xhr.addEventListener('load', () => { if (xhr.status === 200) resolve(JSON.parse(xhr.responseText)); else reject(new Error(xhr.responseText)); });
          xhr.addEventListener('error', () => reject(new Error('Network error')));
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
          xhr.setRequestHeader('X-Unique-Upload-Id', uniqueId);
          xhr.setRequestHeader('Content-Range', `bytes ${start}-${end-1}/${file.size}`);
          xhr.send(formData);
        }).catch((err) => {
          showToast(`Upload failed on chunk ${i+1}: ${err.message}`, 'error');
          prog.style.display = 'none';
          return null;
        });
        if (!result) return null;
        if (i === totalChunks - 1 && result.secure_url) {
          uploadedFileURL = result.secure_url;
          window._uploadedFileURL = result.secure_url;
          bar.style.width = '100%';
          nameEl.textContent = `✓ ${file.name} — ready`;
          infoEl.textContent = `// ✓ Uploaded to Cloudinary · ${sizeMB.toFixed(1)} MB`;
          infoEl.classList.add('show');
          showToast('Large file uploaded successfully!', 'success');
          logEvent(analytics, 'file_upload', { name: file.name, size: file.size, provider: 'cloudinary', chunked: true });
          return result.secure_url;
        }
      }
    },

    async publishProject(title, tagline, desc, tags, link, platform, rating, pricing) {
      if (!currentUser) {
        document.getElementById('publishAuthWarning').style.display = 'block';
        return false;
      }
      if (!title.trim()) { showToast('Please enter a project title', 'error'); return false; }
      const btn = document.getElementById('publishBtn');
      btn.classList.add('loading');
      try {
        const selectedType = document.querySelector('.type-opt.sel .type-opt-lbl')?.textContent || 'Game';
        const docRef = await addDoc(collection(db, 'projects'), {
          title, tagline, description: desc,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          externalLink: link, platform, rating, pricing,
          type: selectedType,
          fileURL: uploadedFileURL || window._uploadedFileURL || null,
          authorId: currentUser.uid,
          authorName: currentUser.displayName || currentUser.email,
          status: 'published',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        closeAllModals();
        showToast(`"${title}" is now live! 🚀`, 'success');
        logEvent(analytics, 'project_publish', { type: selectedType, title });
        uploadedFileURL = null;
        window._uploadedFileURL = null;
        return true;
      } catch (err) {
        showToast('Publish failed: ' + err.message, 'error');
        return false;
      } finally {
        btn.classList.remove('loading');
      }
    },

    async saveDraft(title, desc) {
      if (!currentUser) { showToast('Sign in to save drafts', 'error'); return; }
      await addDoc(collection(db, 'drafts'), { title, description: desc, authorId: currentUser.uid, status: 'draft', createdAt: serverTimestamp() });
      showToast('Draft saved!', 'success');
      logEvent(analytics, 'draft_saved');
    },

    async subscribeNewsletter(email) {
      await addDoc(collection(db, 'subscribers'), { email, subscribedAt: serverTimestamp() });
      showToast('Subscribed! Look out for your first digest soon.', 'success');
      logEvent(analytics, 'newsletter_subscribe');
    },

    currentUser: () => currentUser
  };

  function showAuthError(msg) {
    const el = document.getElementById('loginError');
    if (el) { el.textContent = msg; el.classList.add('show'); }
  }
  function setAuthLoading(on) {
    const btn = document.getElementById('authBtn');
    if (btn) btn.classList.toggle('loading', on);
  }
  function friendlyAuthError(code) {
    const map = {
      'auth/user-not-found':        'No account found with that email.',
      'auth/wrong-password':        'Incorrect password. Try again.',
      'auth/email-already-in-use':  'An account already exists with that email.',
      'auth/weak-password':         'Password must be at least 6 characters.',
      'auth/invalid-email':         'Please enter a valid email address.',
      'auth/popup-closed-by-user':  'Sign-in cancelled.',
      'auth/too-many-requests':     'Too many attempts. Please wait.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }
  function closeAllModals() {
    document.querySelectorAll('.overlay.open').forEach(o => { o.classList.remove('open'); });
    document.body.style.overflow = '';
  }


/* =====================================================
   FEATURE FUNCTIONS (inside module scope - can use db directly)
   ===================================================== */

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

function openDashboard() {
  document.getElementById('dashOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  loadDashboardProjects();
  loadDashboardAnalytics();
  loadDashboardProfile();
}

function closeDashboard() {
  document.getElementById('dashOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function switchDashTab(btn, panelId) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  if (panelId === 'dProjects') loadDashboardProjects();
  if (panelId === 'dAnalytics') loadDashboardAnalytics();
  if (panelId === 'dProfile') loadDashboardProfile();
}

async function loadDashboardProjects() {
  const container = document.getElementById('dashProjectList');
  if (!window._fb || !window._fb.currentUser()) {
    container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text3);font-family:var(--font-mono);">// Sign in to view your projects</div>`;
    return;
  }
  container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text3);font-family:var(--font-mono);">// Loading your projects…</div>`;
  try {
    const user = window._fb.currentUser();
    const q = query(collection(db, 'projects'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      container.innerHTML = `<div style="text-align:center;padding:4rem 2rem;"><div style="font-size:3rem;margin-bottom:1rem;">📦</div><div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:var(--text);margin-bottom:0.5rem;">No projects yet</div><div style="font-size:0.85rem;color:var(--text2);margin-bottom:1.5rem;">Publish your first creation and it will appear here.</div><button class="btn btn-primary" onclick="closeDashboard();openModal('uploadModal');">+ Publish Your First Project</button></div>`;
      return;
    }
    let html = '';
    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const docId = docSnap.id;
      const typeEmoji = { 'Game': '🎮', 'App / Tool': '📱', 'Video': '🎬', 'Photo / Art': '📷', 'Post': '✏️', 'Music / Audio': '🎵' }[p.type] || '📦';
      const dateStr = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
      const views = p.views || 0;
      const comments = p.commentsCount || 0;
      const thumbHtml = p.fileURL
        ? `<img src="${p.fileURL}" onerror="this.remove();this.parentElement.textContent='${typeEmoji}';">`
        : typeEmoji;
      html += `<div class="dash-project-row" data-dash-id="${docId}"><div class="dash-project-thumb" onclick="viewProjectFromDash('${docId}')" style="cursor:pointer;">${thumbHtml}</div><div class="dash-project-info"><div class="dash-project-title" onclick="viewProjectFromDash('${docId}')" style="cursor:pointer;">${escapeHtml(p.title || 'Untitled')}</div><div class="dash-project-meta"><span>${p.type || 'Project'}</span><span>·</span><span>${p.pricing || 'Free'}</span><span>·</span><span>${dateStr}</span><span>·</span><span>👁 ${views}</span><span>·</span><span>💬 ${comments}</span></div></div><div class="dash-project-actions"><button class="dash-action-btn primary" onclick="openEditModal('${docId}')">Edit</button><button class="dash-action-btn" onclick="viewProjectFromDash('${docId}')">View</button><button class="dash-action-btn danger" onclick="confirmDelete('${docId}', '${escapeHtml(p.title || 'Untitled')}')">Delete</button></div></div>`;
    });
    container.innerHTML = html;
    document.getElementById('dStatProjects').textContent = snapshot.size;
  } catch (err) {
    console.error('Dashboard projects error:', err);
    container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--red);font-family:var(--font-mono);">// Error loading projects: ${escapeHtml(err.message)}</div>`;
  }
}

function viewProjectFromDash(docId) { closeDashboard(); openProjectPage(docId); }

async function loadDashboardAnalytics() {
  const chartContainer = document.getElementById('analyticsChart');
  if (!window._fb || !window._fb.currentUser()) { chartContainer.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text3);font-family:var(--font-mono);">// Sign in to view analytics</div>`; return; }
  try {
    const user = window._fb.currentUser();
    const q = query(collection(db, 'projects'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) { chartContainer.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text3);font-family:var(--font-mono);">// Publish projects to see analytics</div>`; document.getElementById('dStatViews').textContent = '0'; document.getElementById('dStatComments').textContent = '0'; return; }
    let totalViews = 0, totalComments = 0, maxViews = 0;
    const projects = [];
    snapshot.forEach(docSnap => { const p = docSnap.data(); const views = p.views || 0; const comments = p.commentsCount || 0; totalViews += views; totalComments += comments; maxViews = Math.max(maxViews, views); projects.push({ title: p.title || 'Untitled', views }); });
    document.getElementById('dStatViews').textContent = totalViews.toLocaleString();
    document.getElementById('dStatComments').textContent = totalComments.toLocaleString();
    let barsHtml = '';
    projects.forEach(proj => { const pct = maxViews > 0 ? (proj.views / maxViews * 100) : 0; barsHtml += `<div class="analytics-bar-wrap"><div class="analytics-bar-label"><span>${escapeHtml(proj.title)}</span><span style="color:var(--accent);">${proj.views.toLocaleString()} views</span></div><div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:0%;" data-target-width="${pct}%"></div></div></div>`; });
    chartContainer.innerHTML = barsHtml;
    setTimeout(() => { chartContainer.querySelectorAll('.analytics-bar-fill').forEach(bar => { bar.style.width = bar.dataset.targetWidth; }); }, 100);
  } catch (err) { console.error('Analytics error:', err); chartContainer.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--red);font-family:var(--font-mono);">// Error loading analytics</div>`; }
}

async function loadDashboardProfile() {
  if (!window._fb || !window._fb.currentUser()) return;
  const user = window._fb.currentUser();
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const data = userDoc.exists() ? userDoc.data() : {};
    document.getElementById('profileName').value = data.displayName || user.displayName || '';
    document.getElementById('profileUsername').value = data.username || '';
    document.getElementById('profileBio').value = data.bio || '';
    document.getElementById('profileLocation').value = data.location || '';
    document.getElementById('profileTwitter').value = data.twitter || '';
    document.getElementById('profileGithub').value = data.github || '';
    document.getElementById('profileItch').value = data.itch || '';
    document.getElementById('profileWebsite').value = data.website || '';
    const avatarWrap = document.getElementById('profileAvatarWrap');
    const avatarEmoji = document.getElementById('profileAvatarEmoji');
    if (data.photoURL || user.photoURL) { avatarWrap.innerHTML = `<img src="${data.photoURL || user.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.remove();document.getElementById('profileAvatarEmoji').style.display='flex';">` + avatarWrap.innerHTML; avatarEmoji.style.display = 'none'; }
    else { avatarEmoji.textContent = (data.displayName || user.displayName || '?').slice(0, 1).toUpperCase(); }
    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar) navAvatar.textContent = (data.displayName || user.displayName || user.email || '?').slice(0, 2).toUpperCase();
    const menuName = document.getElementById('menuDisplayName');
    if (menuName) menuName.textContent = data.displayName || user.displayName || 'Creator';
  } catch (err) { console.error('Profile load error:', err); }
}

async function saveProfile() {
  if (!window._fb || !window._fb.currentUser()) { showToast('Sign in to save profile', 'error'); return; }
  const btn = document.getElementById('saveProfileBtn'); btn.classList.add('loading');
  try {
    const user = window._fb.currentUser();
    const updates = { displayName: document.getElementById('profileName').value.trim(), username: document.getElementById('profileUsername').value.trim().replace(/^@/, ''), bio: document.getElementById('profileBio').value.trim(), location: document.getElementById('profileLocation').value.trim(), twitter: document.getElementById('profileTwitter').value.trim(), github: document.getElementById('profileGithub').value.trim(), itch: document.getElementById('profileItch').value.trim(), website: document.getElementById('profileWebsite').value.trim(), updatedAt: serverTimestamp() };
    await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
    if (updates.displayName) await updateProfile(user, { displayName: updates.displayName });
    showToast('Profile saved! 🎉', 'success');
    const navAvatar = document.getElementById('navAvatar'); if (navAvatar) navAvatar.textContent = (updates.displayName || user.email || '?').slice(0, 2).toUpperCase();
    const menuName = document.getElementById('menuDisplayName'); if (menuName) menuName.textContent = updates.displayName || 'Creator';
  } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
  finally { btn.classList.remove('loading'); }
}

async function uploadAvatar(input) {
  if (!input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { showToast('Avatar must be under 5MB', 'error'); return; }
  try {
    const url = await window._fb.uploadFile(file);
    if (!url) return;
    const user = window._fb.currentUser();
    await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true });
    await updateProfile(user, { photoURL: url });
    const avatarWrap = document.getElementById('profileAvatarWrap');
    const avatarEmoji = document.getElementById('profileAvatarEmoji');
    avatarWrap.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.remove();document.getElementById('profileAvatarEmoji').style.display='flex';">`;
    avatarEmoji.style.display = 'none';
    showToast('Avatar updated! 🎉', 'success');
  } catch (err) { showToast('Avatar upload failed: ' + err.message, 'error'); }
}

async function openProjectPage(docId) {
  if (!window._fb) return;
  const page = document.getElementById('projectPage'); page.classList.add('open'); document.body.style.overflow = 'hidden';
  document.getElementById('ppTitle').textContent = 'Loading…'; document.getElementById('ppDesc').textContent = 'Loading project details…';
  document.getElementById('ppCommentsList').innerHTML = '<div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text3);">// Loading comments…</div>';
  try {
    const user = window._fb.currentUser();
    const docRef = doc(db, 'projects', docId); const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) { document.getElementById('ppTitle').textContent = 'Project Not Found'; document.getElementById('ppDesc').textContent = 'This project may have been removed or the link is incorrect.'; return; }
    const p = docSnap.data(); window._currentProjectId = docId; window._currentProjectAuthorId = p.authorId;
    document.getElementById('ppTitle').textContent = p.title || 'Untitled';
    document.getElementById('projectPageBreadcrumb').textContent = `// ${(p.type || 'project').toLowerCase()} · ${escapeHtml(p.title || 'untitled')}`;
    const thumbEl = document.getElementById('ppThumb');
    if (p.fileURL) { thumbEl.innerHTML = `<img src="${p.fileURL}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent='${{Game:'🎮','App / Tool':'📱',Video:'🎬','Photo / Art':'📷',Post:'✏️','Music / Audio':'🎵'}[p.type] || '📦'}'">`; }
    else { const emoji = { Game:'🎮', 'App / Tool':'📱', Video:'🎬', 'Photo / Art':'📷', Post:'✏️', 'Music / Audio':'🎵' }[p.type] || '📦'; thumbEl.textContent = emoji; }
    const metaHtml = [];
    if (p.type) metaHtml.push(`<span class="type-badge tb-${p.type.toLowerCase().replace(/[^a-z]/g,'')}">${p.type}</span>`);
    if (p.platform) metaHtml.push(`<span style="font-size:0.72rem;color:var(--text3);font-family:var(--font-mono);">🖥 ${p.platform}</span>`);
    if (p.pricing) metaHtml.push(`<span style="font-size:0.72rem;color:var(--accent);font-family:var(--font-mono);">${p.pricing}</span>`);
    if (p.rating) metaHtml.push(`<span style="font-size:0.72rem;color:var(--text3);font-family:var(--font-mono);">${p.rating}</span>`);
    document.getElementById('ppMeta').innerHTML = metaHtml.join('<span style="color:var(--border2);"> · </span>');
    const actionsHtml = [];
    if (p.externalLink) actionsHtml.push(`<a href="${escapeHtml(p.externalLink)}" target="_blank" class="btn btn-primary"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg> Download / Play</a>`);
    actionsHtml.push(`<button class="btn btn-ghost" onclick="saveItem(this,'${escapeHtml(p.title || '')}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save</button>`);
    actionsHtml.push(`<button class="btn btn-ghost" onclick="shareCurrentProject()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share</button>`);
    const isOwner = user && user.uid === p.authorId;
    const isAdmin = isAdminUser();
    if (isOwner) actionsHtml.push(`<button class="btn btn-ghost" onclick="openEditModal('${docId}');closeProjectPage();"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>`);
    if (isOwner || isAdmin) actionsHtml.push(`<button class="btn btn-ghost" style="color:var(--red);border-color:rgba(239,68,68,0.3);" onclick="confirmDelete('${docId}','${escapeHtml((p.title||'').replace(/'/g,"\\'"))}');closeProjectPage();"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> ${isOwner ? 'Delete' : 'Remove (Admin)'}</button>`);
    document.getElementById('ppActions').innerHTML = actionsHtml.join('');
    document.getElementById('ppDesc').textContent = p.description || p.tagline || 'No description provided.';
    const tagsEl = document.getElementById('ppTags');
    if (p.tags && p.tags.length) tagsEl.innerHTML = p.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(''); else tagsEl.innerHTML = '';
    await loadProjectAuthor(p.authorId, p.authorName);
    loadComments(docId);
    await updateDoc(docRef, { views: increment(1) });
    logEvent(analytics, 'project_view', { projectId: docId, title: p.title });
  } catch (err) { console.error('Project page error:', err); document.getElementById('ppTitle').textContent = 'Error'; document.getElementById('ppDesc').textContent = 'Could not load project: ' + err.message; }
}

async function loadProjectAuthor(authorId, fallbackName) {
  const avatarEl = document.getElementById('ppAuthorAvatar'); const nameEl = document.getElementById('ppAuthorName'); const subEl = document.getElementById('ppAuthorSub'); const followBtn = document.getElementById('ppFollowBtn');
  try {
    const user = window._fb.currentUser();
    if (!authorId) { avatarEl.textContent = '?'; nameEl.textContent = fallbackName || 'Unknown'; subEl.textContent = ''; followBtn.style.display = 'none'; return; }
    const userDoc = await getDoc(doc(db, 'users', authorId)); const data = userDoc.exists() ? userDoc.data() : {};
    const displayName = data.displayName || fallbackName || 'Creator'; avatarEl.textContent = displayName.slice(0, 2).toUpperCase(); nameEl.textContent = displayName;
    const specialty = data.bio ? data.bio.slice(0, 60) + (data.bio.length > 60 ? '…' : '') : 'Solo Developer'; const location = data.location ? ` · ${data.location}` : '';
    subEl.textContent = `${specialty}${location}`;
    if (user && user.uid !== authorId) {
      followBtn.style.display = 'block';
      const followDoc = await getDoc(doc(db, 'follows', `${user.uid}_${authorId}`));
      if (followDoc.exists()) { followBtn.textContent = 'Following ✓'; followBtn.classList.add('following'); }
      else { followBtn.textContent = 'Follow'; followBtn.classList.remove('following'); }
    } else { followBtn.style.display = 'none'; }
  } catch (err) { avatarEl.textContent = '?'; nameEl.textContent = fallbackName || 'Creator'; subEl.textContent = ''; }
}

function shareCurrentProject() { const url = window.location.href; if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast('Project link copied!', 'success')); else showToast('Link copied!', 'success'); }
function closeProjectPage() { document.getElementById('projectPage').classList.remove('open'); document.body.style.overflow = ''; }

async function toggleFollowCreator() {
  if (!window._fb || !window._fb.currentUser()) { showToast('Sign in to follow creators', 'info'); openModal('loginModal'); return; }
  const btn = document.getElementById('ppFollowBtn'); const authorId = window._currentProjectAuthorId; if (!authorId) return;
  await followUserToggle(authorId, btn);
}

async function followUserToggle(targetUid, btn) {
  if (!window._fb || !window._fb.currentUser()) { showToast('Sign in to follow creators', 'info'); openModal('loginModal'); return; }
  const user = window._fb.currentUser();
  if (user.uid === targetUid) { showToast("You can't follow yourself", 'info'); return; }
  const followId = `${user.uid}_${targetUid}`; const followRef = doc(db, 'follows', followId);
  try {
    const followDoc = await getDoc(followRef);
    if (followDoc.exists()) {
      await deleteDoc(followRef);
      if (btn) { btn.textContent = 'Follow'; btn.classList.remove('following'); }
      showToast('Unfollowed', 'info');
    } else {
      await setDoc(followRef, { followerId: user.uid, followingId: targetUid, createdAt: serverTimestamp() });
      if (btn) { btn.textContent = 'Following ✓'; btn.classList.add('following'); }
      showToast('Now following!', 'success');
      await addDoc(collection(db, 'notifications'), { recipientId: targetUid, senderId: user.uid, senderName: user.displayName || 'Someone', type: 'follow', message: `${user.displayName || 'Someone'} started following you`, read: false, createdAt: serverTimestamp() });
    }
    const followerCountEl = document.getElementById('cpStatFollowers');
    if (followerCountEl && window._currentCreatorId === targetUid) loadCreatorFollowerCount(targetUid);
  } catch (err) { showToast('Follow failed: ' + err.message, 'error'); }
}

/* ===== PUBLIC CREATOR PROFILE PAGE ===== */
function resetCreatorPage() {
  document.getElementById('cpDemoBadge').style.display = 'none';
  document.getElementById('cpAvatar').innerHTML = '?';
  document.getElementById('cpNameText').textContent = 'Loading…';
  document.getElementById('cpHandle').textContent = '';
  document.getElementById('cpBio').textContent = '';
  document.getElementById('cpMetaRow').innerHTML = '';
  document.getElementById('cpSocialRow').innerHTML = '';
  document.getElementById('cpStatProjects').textContent = '—';
  document.getElementById('cpStatFollowers').textContent = '—';
  document.getElementById('cpStatViews').textContent = '—';
  document.getElementById('cpProjectsGrid').innerHTML = '<div class="creator-empty">// Loading projects…</div>';
  document.getElementById('cpActions').style.display = 'flex';
}

function socialLinkRow(url, label, icon) {
  if (!url) return '';
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return `<a href="${href}" target="_blank" class="creator-social-link">${icon} ${label}</a>`;
}

async function openCreatorProfile(uid, fallbackName) {
  if (!uid) { showToast(`${fallbackName || 'This creator'} doesn't have a public profile yet`, 'info'); return; }
  const page = document.getElementById('creatorPage');
  page.classList.add('open'); document.body.style.overflow = 'hidden';
  resetCreatorPage();
  window._currentCreatorId = uid;
  document.getElementById('cpBreadcrumb').textContent = '// creator profile';
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    const data = userDoc.exists() ? userDoc.data() : {};
    const displayName = data.displayName || fallbackName || 'Creator';
    document.getElementById('cpNameText').textContent = displayName;
    document.getElementById('cpHandle').textContent = data.username ? `@${data.username}` : '';
    document.getElementById('cpBio').textContent = data.bio || "This creator hasn't written a bio yet.";
    const avatarEl = document.getElementById('cpAvatar');
    avatarEl.innerHTML = data.photoURL
      ? `<img src="${data.photoURL}" onerror="this.remove();this.parentElement.textContent='${displayName.slice(0,2).toUpperCase()}';">`
      : displayName.slice(0, 2).toUpperCase();
    const metaParts = [];
    if (data.location) metaParts.push(`<span>📍 ${escapeHtml(data.location)}</span>`);
    if (data.createdAt?.toDate) metaParts.push(`<span>🗓 Joined ${data.createdAt.toDate().toLocaleDateString('en-US',{month:'short',year:'numeric'})}</span>`);
    document.getElementById('cpMetaRow').innerHTML = metaParts.join('');
    document.getElementById('cpSocialRow').innerHTML = [
      socialLinkRow(data.website, 'Website', '🌐'),
      socialLinkRow(data.itch, 'itch.io', '🎮'),
      socialLinkRow(data.twitter, 'Twitter / X', '𝕏'),
      socialLinkRow(data.github, 'GitHub', '💻'),
    ].join('');
    const currentUser = window._fb.currentUser();
    const followBtn = document.getElementById('cpFollowBtn');
    if (currentUser && currentUser.uid === uid) {
      document.getElementById('cpActions').innerHTML = `<button class="btn btn-ghost btn-sm" onclick="closeCreatorPage();openDashboard();">⚙ Edit your profile</button>`;
    } else {
      document.getElementById('cpActions').innerHTML = `<button class="follow-btn-lg" id="cpFollowBtn" onclick="toggleFollowFromCreatorPage()">Follow</button>`;
      if (currentUser) {
        const followDoc = await getDoc(doc(db, 'follows', `${currentUser.uid}_${uid}`));
        const btn = document.getElementById('cpFollowBtn');
        if (followDoc.exists()) { btn.textContent = 'Following ✓'; btn.classList.add('following'); }
      }
    }
    await Promise.all([loadCreatorProjects(uid), loadCreatorFollowerCount(uid)]);
  } catch (err) {
    document.getElementById('cpNameText').textContent = 'Error loading profile';
    showToast('Could not load profile: ' + err.message, 'error');
  }
}

function openDemoCreatorProfile(el) {
  const page = document.getElementById('creatorPage');
  page.classList.add('open'); document.body.style.overflow = 'hidden';
  resetCreatorPage();
  window._currentCreatorId = null;
  const name = el.dataset.name, handle = el.dataset.handle, bio = el.dataset.bio;
  const location = el.dataset.location, initials = el.dataset.initials, projects = el.dataset.projects;
  document.getElementById('cpBreadcrumb').textContent = `// ${handle}`;
  document.getElementById('cpDemoBadge').style.display = 'inline-flex';
  document.getElementById('cpNameText').textContent = name;
  document.getElementById('cpHandle').textContent = handle;
  document.getElementById('cpBio').textContent = bio;
  document.getElementById('cpAvatar').textContent = initials;
  document.getElementById('cpAvatar').style.background = el.dataset.bg;
  document.getElementById('cpAvatar').style.color = el.dataset.color;
  document.getElementById('cpAvatar').style.borderColor = el.dataset.border;
  document.getElementById('cpMetaRow').innerHTML = `<span>📍 ${escapeHtml(location)}</span>`;
  document.getElementById('cpStatProjects').textContent = projects;
  document.getElementById('cpStatFollowers').textContent = '—';
  document.getElementById('cpStatViews').textContent = '—';
  document.getElementById('cpSocialRow').innerHTML = '';
  document.getElementById('cpActions').innerHTML = `<button class="follow-btn-lg" onclick="showToast('This is a sample profile — follows work on real published creator accounts.','info')">Follow</button>`;
  document.getElementById('cpProjectsGrid').innerHTML = `<div class="creator-empty">// Sample profile — real published projects from registered creators appear here.</div>`;
}

async function loadCreatorProjects(uid) {
  const grid = document.getElementById('cpProjectsGrid');
  try {
    const q = query(collection(db, 'projects'), where('authorId', '==', uid));
    const snapshot = await getDocs(q);
    document.getElementById('cpStatProjects').textContent = snapshot.size;
    if (snapshot.empty) {
      grid.innerHTML = `<div class="creator-empty">// No published projects yet</div>`;
      document.getElementById('cpStatViews').textContent = '0';
      return;
    }
    const typeMap = { 'Game': { cls: 'tb-game', emoji: '🎮' }, 'App / Tool': { cls: 'tb-app', emoji: '📱' }, 'Video': { cls: 'tb-video', emoji: '🎬' }, 'Photo / Art': { cls: 'tb-photo', emoji: '📷' }, 'Post': { cls: 'tb-post', emoji: '✏️' }, 'Music / Audio': { cls: 'tb-music', emoji: '🎵' } };
    let totalViews = 0; let html = '';
    snapshot.forEach(docSnap => {
      const p = docSnap.data(); const docId = docSnap.id;
      totalViews += (p.views || 0);
      const info = typeMap[p.type] || { cls: 'tb-app', emoji: '📦' };
      const thumb = p.fileURL ? `<img src="${p.fileURL}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" onerror="this.remove();"><div class="card-thumb-bg" style="background:linear-gradient(135deg,#0f172a,#1e293b);">${info.emoji}</div>` : `<div class="card-thumb-bg" style="background:linear-gradient(135deg,#0f172a,#1e293b);">${info.emoji}</div>`;
      html += `<div class="card" style="cursor:pointer;" onclick="closeCreatorPage();openProjectPage('${docId}')">
        <div class="card-thumb">${thumb}<span class="type-badge ${info.cls}">${p.type || 'Project'}</span></div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(p.title || 'Untitled')}</div>
          <div class="card-desc">${escapeHtml((p.description || '').slice(0, 80))}${(p.description||'').length > 80 ? '…' : ''}</div>
        </div>
        <div class="card-footer"><div class="card-meta"><span class="meta-item">👁 ${p.views || 0}</span><span class="meta-item">${p.pricing || 'Free'}</span></div></div>
      </div>`;
    });
    grid.innerHTML = html;
    document.getElementById('cpStatViews').textContent = totalViews.toLocaleString();
  } catch (err) {
    grid.innerHTML = `<div class="creator-empty">// Error loading projects</div>`;
  }
}

async function loadCreatorFollowerCount(uid) {
  try {
    const snap = await getCountFromServer(query(collection(db, 'follows'), where('followingId', '==', uid)));
    document.getElementById('cpStatFollowers').textContent = snap.data().count;
  } catch (err) {
    document.getElementById('cpStatFollowers').textContent = '—';
  }
}

function toggleFollowFromCreatorPage() {
  const btn = document.getElementById('cpFollowBtn');
  const uid = window._currentCreatorId;
  if (!uid) { showToast('Follows work on real published creator accounts', 'info'); return; }
  followUserToggle(uid, btn);
}

function openCreatorProfileFromProjectPage() {
  const uid = window._currentProjectAuthorId;
  const name = document.getElementById('ppAuthorName')?.textContent;
  if (!uid) { showToast("This creator doesn't have a public profile yet", 'info'); return; }
  openCreatorProfile(uid, name);
}

function viewMyPublicProfile() {
  if (!window._fb || !window._fb.currentUser()) { showToast('Sign in first', 'info'); return; }
  const user = window._fb.currentUser();
  closeDashboard();
  openCreatorProfile(user.uid, user.displayName);
}

function closeCreatorPage() { document.getElementById('creatorPage').classList.remove('open'); document.body.style.overflow = ''; }
function shareCreatorProfile() { if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).then(() => showToast('Profile link copied!', 'success')); else showToast('Link copied!', 'success'); }

async function loadComments(projectId) {
  const listEl = document.getElementById('ppCommentsList');
  try { const q = query(collection(db, 'projects', projectId, 'comments'), orderBy('createdAt', 'desc')); const snapshot = await getDocs(q); document.getElementById('ppCommentsTitle').textContent = `Comments (${snapshot.size})`; if (snapshot.empty) { listEl.innerHTML = `<div class="comments-empty">No comments yet. Be the first to share your thoughts!</div>`; return; } let html = ''; snapshot.forEach(docSnap => { const c = docSnap.data(); const dateStr = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'; const isOwner = window._fb.currentUser() && window._fb.currentUser().uid === c.authorId; const isAdmin = window._fb.isAdmin && window._fb.isAdmin(); const canDeleteComment = isOwner || isAdmin; html += `<div class="comment-item" data-comment-id="${docSnap.id}"><div class="comment-avatar">${(c.authorName || '?').slice(0, 2).toUpperCase()}</div><div class="comment-body"><div class="comment-author-row"><span class="comment-author">${escapeHtml(c.authorName || 'Anonymous')}</span>${canDeleteComment ? `<button class="comment-delete-btn" onclick="deleteComment('${projectId}', '${docSnap.id}')">${isOwner ? 'Delete' : 'Remove (Admin)'}</button>` : ''}</div><div class="comment-text">${escapeHtml(c.text || '')}</div><div class="comment-time">${dateStr}</div></div></div>`; }); listEl.innerHTML = html;
  } catch (err) { console.error('Load comments error:', err); listEl.innerHTML = `<div class="comments-empty">Error loading comments: ${escapeHtml(err.message || 'unknown error')}</div>`; }
}

async function submitComment() {
  const input = document.getElementById('ppCommentInput'); const text = input.value.trim(); if (!text) return;
  if (!window._fb || !window._fb.currentUser()) { showToast('Sign in to comment', 'info'); openModal('loginModal'); return; }
  const projectId = window._currentProjectId; if (!projectId) return;
  try { const user = window._fb.currentUser(); await addDoc(collection(db, 'projects', projectId, 'comments'), { text: text, authorId: user.uid, authorName: user.displayName || 'Anonymous', createdAt: serverTimestamp() }); await updateDoc(doc(db, 'projects', projectId), { commentsCount: increment(1) }); input.value = ''; input.style.height = 'auto'; showToast('Comment posted!', 'success'); loadComments(projectId); const projectDoc = await getDoc(doc(db, 'projects', projectId)); if (projectDoc.exists()) { const p = projectDoc.data(); if (p.authorId && p.authorId !== user.uid) await addDoc(collection(db, 'notifications'), { recipientId: p.authorId, senderId: user.uid, senderName: user.displayName || 'Someone', type: 'comment', projectId: projectId, projectTitle: p.title || 'a project', message: `${user.displayName || 'Someone'} commented on "${p.title || 'your project'}"`, read: false, createdAt: serverTimestamp() }); }
  } catch (err) { showToast('Comment failed: ' + err.message, 'error'); }
}

async function deleteComment(projectId, commentId) { if (!confirm('Delete this comment?')) return; try { await deleteDoc(doc(db, 'projects', projectId, 'comments', commentId)); await updateDoc(doc(db, 'projects', projectId), { commentsCount: increment(-1) }); showToast('Comment deleted', 'success'); loadComments(projectId); } catch (err) { showToast('Delete failed: ' + err.message, 'error'); } }

let notifUnsubscribe = null;
function toggleNotifPanel() { const panel = document.getElementById('notifPanel'); panel.classList.toggle('open'); if (panel.classList.contains('open')) loadNotifications(); }
async function loadNotifications() {
  if (!window._fb || !window._fb.currentUser()) { document.getElementById('notifList').innerHTML = `<div class="notif-empty">Sign in to see notifications</div>`; document.getElementById('notifBadge').style.display = 'none'; return; }
  const user = window._fb.currentUser(); if (notifUnsubscribe) notifUnsubscribe();
  const q = query(collection(db, 'notifications'), where('recipientId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));
  notifUnsubscribe = onSnapshot(q, (snapshot) => { const listEl = document.getElementById('notifList'); const badge = document.getElementById('notifBadge'); let unreadCount = 0; if (snapshot.empty) { listEl.innerHTML = `<div class="notif-empty">You're all caught up ✓</div>`; badge.style.display = 'none'; return; } let html = ''; snapshot.forEach(docSnap => { const n = docSnap.data(); if (!n.read) unreadCount++; const iconMap = { follow: '👤', comment: '💬', like: '❤️', project: '🎮', mention: '@' }; const icon = iconMap[n.type] || '🔔'; const dateStr = n.createdAt?.toDate ? timeAgo(n.createdAt.toDate()) : '—'; html += `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${docSnap.id}', '${n.type}', '${n.projectId || ''}')"><div class="notif-icon">${icon}</div><div class="notif-text"><div class="notif-title">${escapeHtml(n.message || 'Notification')}</div><div class="notif-time">${dateStr}</div></div></div>`; }); listEl.innerHTML = html; if (unreadCount > 0) { badge.textContent = unreadCount > 99 ? '99+' : unreadCount; badge.style.display = 'flex'; } else { badge.style.display = 'none'; } }, (err) => { console.error('Notifications error:', err); document.getElementById('notifList').innerHTML = `<div class="notif-empty">Error loading notifications</div>`; });
}
async function handleNotifClick(notifId, type, projectId) { try { await updateDoc(doc(db, 'notifications', notifId), { read: true }); document.getElementById('notifPanel').classList.remove('open'); if (type === 'comment' && projectId) openProjectPage(projectId); else if (type === 'follow') showToast('Check out their profile!', 'info'); else showToast('Notification opened', 'info'); } catch (err) { console.error('Notif click error:', err); } }
async function markAllRead() { if (!window._fb || !window._fb.currentUser()) return; try { const user = window._fb.currentUser(); const q = query(collection(db, 'notifications'), where('recipientId', '==', user.uid), where('read', '==', false)); const snapshot = await getDocs(q); const batch = []; snapshot.forEach(docSnap => { batch.push(updateDoc(doc(db, 'notifications', docSnap.id), { read: true })); }); await Promise.all(batch); showToast('All notifications marked as read', 'success'); } catch (err) { showToast('Error: ' + err.message, 'error'); } }
document.addEventListener('click', (e) => { const panel = document.getElementById('notifPanel'); const btn = document.getElementById('notifBtn'); if (panel && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) panel.classList.remove('open'); });

// ===== Expose module-scoped functions to global scope for inline onclick handlers =====
window.openDashboard         = openDashboard;
window.closeDashboard        = closeDashboard;
window.switchDashTab         = switchDashTab;
window.viewProjectFromDash   = viewProjectFromDash;
window.saveProfile           = saveProfile;
window.uploadAvatar          = uploadAvatar;
window.openProjectPage       = openProjectPage;
window.shareCurrentProject   = shareCurrentProject;
window.closeProjectPage      = closeProjectPage;
window.toggleFollowCreator   = toggleFollowCreator;
window.submitComment         = submitComment;
window.deleteComment         = deleteComment;
window.toggleNotifPanel      = toggleNotifPanel;
window.markAllRead           = markAllRead;
window.handleNotifClick      = handleNotifClick;
window.openCreatorProfile              = openCreatorProfile;
window.openDemoCreatorProfile          = openDemoCreatorProfile;
window.closeCreatorPage                = closeCreatorPage;
window.shareCreatorProfile             = shareCreatorProfile;
window.toggleFollowFromCreatorPage     = toggleFollowFromCreatorPage;
window.openCreatorProfileFromProjectPage = openCreatorProfileFromProjectPage;
window.viewMyPublicProfile             = viewMyPublicProfile;
