const initialProfile = {
  name: 'Glitch',
  role: 'Creative Developer / Digital Designer',
  bio: 'أحوّل الأفكار إلى تجارب رقمية جريئة، وأحب التفاصيل التي تجعل كل واجهة تبدو كأنها من عالم آخر.',
  location: 'Night City, NC',
  status: 'OPEN TO COLLABORATION',
  email: 'hello@glitch.dev'
};

let profile = { ...initialProfile };
try {
  const savedProfile = JSON.parse(localStorage.getItem('glitch-profile') || '{}');
  profile = { ...profile, ...savedProfile };
} catch (_) {
  // Keep the starter profile if browser storage is unavailable.
}

const app = document.querySelector('#app');
const menu = document.querySelector('#route-menu');
const toast = document.querySelector('#toast');
const routeNames = ['home', 'profile', 'projects', 'contact', 'configure', 'manage'];
const editPasswordKey = 'glitch-edit-password';
let ownerUnlocked = false;
let toastTimer;
let lastFocusedElement = null;

const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

function pageFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-identity"><img class="footer-nerv" src="assets/nerv-wallpaper.jpg" alt="NERV organization logo"><div class="footer-copy"><strong>© 2077 GLITCH_ / NERV</strong><br>BUILT IN NIGHT CITY · ALL SYSTEMS NOMINAL</div></div>
      <div class="footer-links"><a href="#/profile">IDENTITY</a><a href="#/projects">ARCHIVE</a><a href="#/contact">SIGNAL</a></div>
    </footer>
    <div class="status-strip"><span>▰▰▰ SYSTEMS OPERATIONAL · ACCESS GRANTED · WELCOME TO MY CORNER OF THE NET ▰▰▰</span></div>`;
}

function homePage() {
  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="hero-side-note">INDEPENDENT CREATIVE — NIGHT CITY — EST. 2077</div>
        <div class="eyebrow">INDEPENDENT CREATIVE / ${safe(profile.location)}</div>
        <h1>${safe(profile.name)}<span>.</span></h1>
        <div class="hero-kicker">${safe(profile.role).toUpperCase()} <b>—</b> PERSONAL PORTFOLIO</div>
        <p class="hero-description" dir="auto">${safe(profile.bio)}</p>
        <div class="hero-actions">
          <a class="button-acid" href="#/projects">EXPLORE MY WORK <span aria-hidden="true">↗</span></a>
          <a class="button-quiet" href="#/profile">READ MY FILE <span aria-hidden="true">→</span></a>
        </div>
      </div>
      <div class="hero-visual" aria-label="Johnny Silverhand in Night City">
        <div class="corner-code">FIG. 01 / NC-2077</div>
        <div class="side-stamp">NIGHT CITY · LIVE FEED</div>
        <img src="assets/johnny-silverhand-photo.jpg" alt="Johnny Silverhand standing in Night City" fetchpriority="high">
        <div class="visual-colorwash"></div>
        <div class="visual-label">JOHNNY SILVERHAND // NIGHT CITY</div>
        <div class="visual-readout"><b>SUBJECT:</b> JOHNNY SILVERHAND<br><b>STATUS:</b> ACTIVE<br><b>NODE:</b> NIGHT CITY / 2077</div>
        <div class="coordinates">NIGHT CITY<br>34°03' N / 118°15' W<br><span>●</span> SIGNAL ACTIVE</div>
      </div>
    </section>
    <div class="ticker" aria-label="Portfolio status"><span>✳</span> PERSONAL ARCHIVE <span>✳</span> CREATIVE FREQUENCY <span>✳</span> ${safe(profile.status)} <span>✳</span> NIGHT CITY, 2077 <span>✳</span> PERSONAL ARCHIVE <span>✳</span></div>
    <section class="section-block">
      <div class="section-heading"><h2><small>/ 01 — QUICK ACCESS</small>PROJECTS</h2><p>OPEN THE PROJECT ARCHIVE ↘</p></div>
      <div class="tile-grid">
        <a class="route-tile route-tile-wide" href="#/projects"><span class="tile-no">FILE_001 / PROJECT ARCHIVE</span><div><h3>OPEN PROJECTS</h3><p>VIEW THE CURRENT COLLECTION</p></div></a>
      </div>
    </section>
    <section class="bottom-grid">
      <div class="bottom-cell"><div class="system-line">${safe(profile.status)}</div><h3>Got a good mission?</h3><p>Send a signal and tell me what you're building. I’m always up for an interesting collaboration.</p><a class="button-acid" href="#/contact">LET'S TALK <span aria-hidden="true">↗</span></a></div>
    </section>
    ${pageFooter()}`;
}

function profilePage() {
  return `
    <section class="subpage">
      <div class="empty-avatar" aria-hidden="true"><span>G</span></div>
      <div class="page-kicker">PERSONAL FILE // 001</div>
      <h1 class="page-title">THE <em>IDENTITY</em></h1>
      <p class="page-lede" dir="auto">${safe(profile.bio)}</p>
      <dl class="data-panel">
        <div class="data-row"><dt>HANDLE</dt><dd data-profile="name">${safe(profile.name)}</dd></div>
        <div class="data-row"><dt>FUNCTION</dt><dd data-profile="role">${safe(profile.role)}</dd></div>
        <div class="data-row"><dt>LAST KNOWN LOCATION</dt><dd data-profile="location">${safe(profile.location)}</dd></div>
        <div class="data-row"><dt>STATUS</dt><dd data-profile="status">${safe(profile.status)}</dd></div>
        <div class="data-row"><dt>CONTACT CHANNEL</dt><dd data-profile="email">${safe(profile.email)}</dd></div>
      </dl>
      <a class="button-acid" href="#/configure" style="margin-top:22px">EDIT THIS FILE <span aria-hidden="true">↗</span></a>
    </section>${pageFooter()}`;
}

const projectDatabaseName = 'glitch-project-files';
const projectStoreName = 'projects';
let projectDatabasePromise;
let activeProjectUrls = [];

function openProjectDatabase() {
  if (!window.indexedDB) return Promise.reject(new Error('LOCAL_FILE_STORAGE_UNAVAILABLE'));
  if (!projectDatabasePromise) {
    projectDatabasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(projectDatabaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(projectStoreName)) database.createObjectStore(projectStoreName, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('DATABASE_OPEN_FAILED'));
      request.onblocked = () => reject(new Error('DATABASE_OPEN_BLOCKED'));
    });
  }
  return projectDatabasePromise;
}

async function getUploadedProjects() {
  const database = await openProjectDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(projectStoreName, 'readonly').objectStore(projectStoreName).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error || new Error('PROJECT_READ_FAILED'));
  });
}

async function saveUploadedProject(project) {
  const database = await openProjectDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(projectStoreName, 'readwrite');
    transaction.objectStore(projectStoreName).put(project);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('PROJECT_SAVE_FAILED'));
    transaction.onabort = () => reject(transaction.error || new Error('PROJECT_SAVE_ABORTED'));
  });
}

async function deleteUploadedProject(id) {
  const database = await openProjectDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(projectStoreName, 'readwrite');
    transaction.objectStore(projectStoreName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('PROJECT_DELETE_FAILED'));
  });
}

function releaseProjectUrls() {
  activeProjectUrls.forEach((url) => URL.revokeObjectURL(url));
  activeProjectUrls = [];
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadedProjectCard(project, owner = false) {
  const files = Array.isArray(project.files) ? project.files : [];
  const attachments = files.map((file) => {
    if (!(file.blob instanceof Blob)) return '';
    const url = URL.createObjectURL(file.blob);
    activeProjectUrls.push(url);
    if (file.type?.startsWith('image/')) {
      return `<a class="uploaded-image" href="${url}" target="_blank" rel="noopener" aria-label="Open ${safe(file.name)}"><img src="${url}" alt="${safe(file.name)}" loading="lazy"><span>${safe(file.name)}</span></a>`;
    }
    return `<a class="uploaded-file" href="${url}" download="${safe(file.name)}"><span>FILE / ${safe((file.type || 'UNKNOWN').split('/').pop().toUpperCase())}</span><strong>${safe(file.name)}</strong><small>${formatFileSize(file.size || 0)} · DOWNLOAD</small></a>`;
  }).join('');
  return `<article class="project-card uploaded-project-card">
    <div class="uploaded-project-head"><div class="project-no">OWNER_UPLOAD / ${new Date(project.createdAt).toLocaleDateString('en-GB')}</div>${owner ? `<button class="delete-upload" type="button" data-delete-upload="${safe(project.id)}">REMOVE</button>` : ''}</div>
    <div><span class="upload-category">${safe(project.category || 'PROJECT')}</span><h3>${safe(project.title)}</h3>${project.description ? `<p>${safe(project.description)}</p>` : ''}</div>
    <div class="uploaded-media">${attachments}</div>
  </article>`;
}

async function populateUploadedProjects(elementId, owner = false) {
  const host = document.getElementById(elementId);
  if (!host) return;
  try {
    const projects = await getUploadedProjects();
    if (!host.isConnected) return;
    host.innerHTML = projects.length
      ? projects.map((project) => uploadedProjectCard(project, owner)).join('')
      : `<p class="empty-projects">NO UPLOADED PROJECTS YET. OPEN OWNER UPLOADS TO ADD THE FIRST FILE.</p>`;
  } catch (_) {
    if (host.isConnected) host.innerHTML = `<p class="empty-projects">LOCAL PROJECT STORAGE IS NOT AVAILABLE IN THIS BROWSER.</p>`;
  }
}

function projectsPage() {
  return `
    <section class="subpage">
      <div class="page-kicker">PROJECT ARCHIVE // 003</div>
      <h1 class="page-title"><em>PROJECTS</em></h1>
      <p class="page-lede">Your uploaded projects, images, and files appear here as project cards.</p>
      <div class="project-actions"><span>OWNER ACCESS / UPLOAD AND MANAGE FILES</span><a class="button-quiet" href="#/manage">UPLOAD PROJECT <span aria-hidden="true">↗</span></a></div>
      <div class="project-list" id="uploaded-projects" aria-live="polite"><p class="empty-projects">LOADING PROJECT FILES...</p></div>
    </section>${pageFooter()}`;
}

function manageProjectsPage() {
  const storedPassword = readEditPassword();
  if (!storedPassword?.hash || !storedPassword?.salt) return passwordSetupPage();
  if (!ownerUnlocked) return passwordLoginPage();
  return `
    <section class="subpage">
      <div class="page-kicker">OWNER TOOLS // LOCAL PROJECT STORAGE</div>
      <h1 class="page-title">UPLOAD <em>WORK</em></h1>
      <p class="page-lede">Add a project with images or files. Your uploads are saved in this browser and appear on the Projects page.</p>
      <form class="upload-form" id="project-upload-form">
        <div class="field"><label for="upload-title">PROJECT TITLE</label><input id="upload-title" name="title" type="text" maxlength="80" required></div>
        <div class="field"><label for="upload-category">CATEGORY / TAG</label><input id="upload-category" name="category" type="text" maxlength="32" placeholder="DESIGN / ART / CODE"></div>
        <div class="field full"><label for="upload-description">DESCRIPTION</label><textarea id="upload-description" name="description" maxlength="400" placeholder="A short note about this project"></textarea></div>
        <div class="field full"><label>PROJECT FILES</label><label class="file-dropzone" id="file-dropzone" for="upload-files"><input id="upload-files" name="files" type="file" multiple required><span class="drop-mark">+</span><strong>DROP IMAGES OR FILES HERE</strong><small>OR CLICK TO BROWSE / MULTIPLE FILES SUPPORTED</small><span class="selected-file-list" id="selected-file-list">NO FILES SELECTED</span></label></div>
        <div class="form-foot"><button class="button-acid" type="submit">SAVE PROJECT <span aria-hidden="true">↗</span></button><span class="save-state" id="upload-state">FILES SAVE TO THIS BROWSER</span></div>
      </form>
      <section class="owner-projects-section"><div class="page-kicker">UPLOADED FILES // OWNER VIEW</div><div class="project-list" id="owner-projects" aria-live="polite"><p class="empty-projects">LOADING PROJECT FILES...</p></div></section>
    </section>${pageFooter()}`;
}

function contactPage() {
  return `
    <section class="subpage">
      <div class="page-kicker">OPEN CHANNEL // 004</div>
      <h1 class="page-title">SEND A <em>SIGNAL</em></h1>
      <p class="page-lede">Have an idea, a project, or a question? Drop me a line and let's see what we can make.</p>
      <div class="contact-panel"><div><small>DIRECT LINE / EMAIL</small><a href="mailto:${safe(profile.email)}" data-profile="email">${safe(profile.email)}</a></div><a class="button-acid" href="mailto:${safe(profile.email)}">START A CONVERSATION <span aria-hidden="true">↗</span></a></div>
      <div class="data-panel">
        <div class="data-row"><dt>TRANSMISSION</dt><dd>EMAIL / OPEN COMMS</dd></div>
        <div class="data-row"><dt>LOCATION</dt><dd data-profile="location">${safe(profile.location)}</dd></div>
        <div class="data-row"><dt>STATUS</dt><dd data-profile="status">${safe(profile.status)}</dd></div>
      </div>
    </section>${pageFooter()}`;
}

function readEditPassword() {
  try { return JSON.parse(localStorage.getItem(editPasswordKey) || 'null'); } catch (_) { return null; }
}

function passwordSetupPage() {
  return `
    <section class="subpage access-page">
      <div class="page-kicker">PRIVATE ACCESS // FIRST USE</div>
      <h1 class="page-title">SET <em>KEY</em></h1>
      <p class="page-lede">Create a password to protect owner uploads and the profile editor on this browser.</p>
      <form class="password-form" id="password-setup-form">
        <div class="field"><label for="new-password">CREATE PASSWORD</label><input id="new-password" name="password" type="password" minlength="8" autocomplete="new-password" required></div>
        <div class="field"><label for="confirm-password">CONFIRM PASSWORD</label><input id="confirm-password" name="confirm" type="password" minlength="8" autocomplete="new-password" required></div>
        <div class="form-foot"><button class="button-acid" type="submit">SET ACCESS KEY <span aria-hidden="true">↗</span></button><span class="save-state" id="password-state">MINIMUM 8 CHARACTERS / SAVED IN THIS BROWSER</span></div>
      </form>
      <div class="access-note"><strong>LOCAL SECURITY</strong><p>Your password is stored as a salted hash in this browser. It does not sync to a server.</p></div>
    </section>${pageFooter()}`;
}

function passwordLoginPage() {
  return `
    <section class="subpage access-page">
      <div class="page-kicker">PRIVATE ACCESS // AUTHENTICATION REQUIRED</div>
      <h1 class="page-title">ENTER <em>KEY</em></h1>
      <p class="page-lede">Enter your password to open the owner tools and profile editor.</p>
      <form class="password-form password-login-form" id="password-login-form">
        <div class="field full"><label for="access-password">PASSWORD</label><input id="access-password" name="password" type="password" autocomplete="current-password" required autofocus></div>
        <div class="form-foot"><button class="button-acid" type="submit">UNLOCK PROFILE <span aria-hidden="true">↗</span></button><span class="save-state" id="password-state">ACCESS LOCKED</span></div>
      </form>
    </section>${pageFooter()}`;
}

function editPage() {
  const storedPassword = readEditPassword();
  if (!storedPassword?.hash || !storedPassword?.salt) return passwordSetupPage();
  if (!ownerUnlocked) return passwordLoginPage();
  const fields = [
    ['name', 'Display name', 'text'],
    ['role', 'Role / headline', 'text'],
    ['location', 'Location', 'text'],
    ['status', 'Availability status', 'text'],
    ['email', 'Email address', 'email'],
    ['bio', 'Short introduction', 'textarea']
  ];
  return `
    <section class="subpage">
      <div class="page-kicker">LOCAL CONFIGURATION // 005</div>
      <h1 class="page-title">EDIT <em>PROFILE</em></h1>
      <p class="page-lede">غيّر بيانات ملفك الشخصي هنا. التعديلات تظهر مباشرةً في الموقع وتُحفظ تلقائياً في هذا المتصفح.</p>
      <form class="edit-form" id="profile-form">
        ${fields.map(([key, label, type]) => `<div class="field ${key === 'bio' ? 'full' : ''}"><label for="field-${key}">${label}</label>${type === 'textarea'
          ? `<textarea id="field-${key}" name="${key}" data-profile-field="${key}" maxlength="220">${safe(profile[key])}</textarea>`
          : `<input id="field-${key}" name="${key}" type="${type}" data-profile-field="${key}" value="${safe(profile[key])}" maxlength="90" autocomplete="off">`}</div>`).join('')}
        <div class="form-foot"><button class="button-acid" type="submit">SAVE PROFILE <span aria-hidden="true">↗</span></button><span class="save-state" id="save-state">CHANGES SAVE AUTOMATICALLY IN THIS BROWSER</span></div>
      </form>
      <dl class="data-panel">
        <div class="data-row"><dt>LIVE PREVIEW / HANDLE</dt><dd data-profile="name">${safe(profile.name)}</dd></div>
        <div class="data-row"><dt>ROLE</dt><dd data-profile="role">${safe(profile.role)}</dd></div>
        <div class="data-row"><dt>LOCATION</dt><dd data-profile="location">${safe(profile.location)}</dd></div>
        <div class="data-row"><dt>STATUS</dt><dd data-profile="status">${safe(profile.status)}</dd></div>
      </dl>
      <section class="security-section">
        <div class="page-kicker">PRIVATE ACCESS / SECURITY</div>
        <h2>CHANGE ACCESS KEY</h2>
        <form class="password-form" id="password-change-form">
          <div class="field"><label for="current-password">CURRENT PASSWORD</label><input id="current-password" name="current" type="password" autocomplete="current-password" required></div>
          <div class="field"><label for="replacement-password">NEW PASSWORD</label><input id="replacement-password" name="password" type="password" minlength="8" autocomplete="new-password" required></div>
          <div class="field full"><label for="replacement-confirm">CONFIRM NEW PASSWORD</label><input id="replacement-confirm" name="confirm" type="password" minlength="8" autocomplete="new-password" required></div>
          <div class="form-foot"><button class="button-quiet" type="submit">UPDATE PASSWORD <span aria-hidden="true">↗</span></button><span class="save-state" id="password-state">PASSWORD HASHED IN THIS BROWSER</span></div>
        </form>
      </section>
      <div class="data-panel">
        <div class="data-row"><dt>STORAGE</dt><dd>THIS BROWSER / LOCAL ONLY</dd></div>
        <div class="data-row"><dt>RESET</dt><dd><button class="button-quiet" type="button" data-reset-profile>RESTORE STARTER PROFILE ↺</button></dd></div>
      </div>
    </section>${pageFooter()}`;
}

const pages = { home: homePage, profile: profilePage, projects: projectsPage, contact: contactPage, configure: editPage, manage: manageProjectsPage };

function currentRoute() {
  const route = location.hash.replace(/^#\/?/, '').split('?')[0];
  return routeNames.includes(route) ? route : 'home';
}

function render() {
  const route = currentRoute();
  releaseProjectUrls();
  app.innerHTML = pages[route]();
  document.title = `${route === 'home' ? safe(profile.name).toUpperCase() : route.toUpperCase()}_ — GLITCH Portfolio`;
  if (route === 'projects') populateUploadedProjects('uploaded-projects');
  if (route === 'manage' && ownerUnlocked) populateUploadedProjects('owner-projects', true);
}

function saveProfileValue(key, value) {
  profile[key] = value;
  try { localStorage.setItem('glitch-profile', JSON.stringify(profile)); } catch (_) { /* Editing still works for this session. */ }
  document.querySelectorAll(`[data-profile="${key}"]`).forEach((element) => {
    if (element instanceof HTMLAnchorElement && element.href.startsWith('mailto:')) {
      element.href = `mailto:${value}`;
    }
    element.textContent = value;
  });
  const state = document.querySelector('#save-state');
  if (state) state.textContent = 'SAVED · CHANGES ARE LIVE';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  return new Uint8Array((hex.match(/.{2}/g) || []).map((pair) => parseInt(pair, 16)));
}

async function derivePasswordHash(password, salt) {
  if (!window.crypto?.subtle) throw new Error('SECURE_CRYPTO_UNAVAILABLE');
  const material = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, material, 256);
  return new Uint8Array(bits);
}

async function makePasswordRecord(password) {
  if (!window.crypto?.getRandomValues) throw new Error('SECURE_CRYPTO_UNAVAILABLE');
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);
  return { salt: bytesToHex(salt), hash: bytesToHex(hash) };
}

async function matchesPassword(password, record) {
  const hash = await derivePasswordHash(password, hexToBytes(record.salt));
  return bytesToHex(hash) === record.hash;
}

function passwordMessage(message) {
  const state = document.querySelector('#password-state');
  if (state) state.textContent = message;
}

function openMenu() {
  lastFocusedElement = document.activeElement;
  menu.classList.add('is-open');
  menu.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  menu.querySelector('[data-route-choice]')?.focus();
}

function closeMenu() {
  menu.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastFocusedElement?.focus?.();
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-open-menu]')) openMenu();
  if (event.target.closest('[data-close-menu]')) closeMenu();
  if (event.target === menu) closeMenu();
  const choice = event.target.closest('[data-route-choice]');
  if (choice) {
    const targetRoute = choice.getAttribute('href')?.replace(/^#\//, '');
    if (['configure', 'manage'].includes(targetRoute) && currentRoute() === targetRoute) {
      ownerUnlocked = false;
      render();
    }
    closeMenu();
  }
  const removeUpload = event.target.closest('[data-delete-upload]');
  if (removeUpload) {
    if (!ownerUnlocked || currentRoute() !== 'manage') return showToast('OWNER ACCESS REQUIRED');
    removeUpload.disabled = true;
    deleteUploadedProject(removeUpload.dataset.deleteUpload).then(() => {
      render();
      showToast('PROJECT REMOVED');
    }).catch(() => {
      removeUpload.disabled = false;
      showToast('COULD NOT REMOVE PROJECT');
    });
    return;
  }
  if (event.target.closest('[data-reset-profile]')) {
    profile = { ...initialProfile };
    try { localStorage.removeItem('glitch-profile'); } catch (_) { /* Keep the reset for this session. */ }
    render();
    showToast('STARTER PROFILE RESTORED');
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'upload-files') {
    const list = document.querySelector('#selected-file-list');
    const names = [...event.target.files].map((file) => file.name);
    if (list) list.textContent = names.length ? names.join(' · ') : 'NO FILES SELECTED';
    return;
  }
  const field = event.target.closest('[data-profile-field]');
  if (!field) return;
  saveProfileValue(field.dataset.profileField, field.value.trimStart());
});

document.addEventListener('change', (event) => {
  if (event.target.id !== 'upload-files') return;
  const list = document.querySelector('#selected-file-list');
  const names = [...event.target.files].map((file) => file.name);
  if (list) list.textContent = names.length ? names.join(' · ') : 'NO FILES SELECTED';
});

document.addEventListener('dragover', (event) => {
  const zone = event.target.closest('#file-dropzone');
  if (!zone) return;
  event.preventDefault();
  zone.classList.add('is-dragging');
});

document.addEventListener('dragleave', (event) => {
  const zone = event.target.closest('#file-dropzone');
  if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('is-dragging');
});

document.addEventListener('drop', (event) => {
  const zone = event.target.closest('#file-dropzone');
  if (!zone) return;
  event.preventDefault();
  zone.classList.remove('is-dragging');
  const input = zone.querySelector('input[type="file"]');
  if (!input || !event.dataTransfer?.files?.length) return;
  input.files = event.dataTransfer.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.id === 'project-upload-form') {
    event.preventDefault();
    if (!ownerUnlocked || currentRoute() !== 'manage') return showToast('OWNER ACCESS REQUIRED');
    const data = new FormData(form);
    const files = [...form.querySelector('#upload-files').files];
    if (!files.length) return showToast('CHOOSE AT LEAST ONE FILE');
    const project = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: String(data.get('title') || '').trim(),
      category: String(data.get('category') || '').trim(),
      description: String(data.get('description') || '').trim(),
      createdAt: Date.now(),
      files: files.map((file) => ({ name: file.name, type: file.type, size: file.size, blob: file }))
    };
    try {
      await saveUploadedProject(project);
      form.reset();
      render();
      showToast('PROJECT ADDED TO ARCHIVE');
    } catch (_) {
      const state = document.querySelector('#upload-state');
      if (state) state.textContent = 'SAVE FAILED / BROWSER STORAGE MAY BE FULL';
    }
    return;
  }
  if (form.id === 'password-setup-form') {
    event.preventDefault();
    const data = new FormData(form);
    const password = String(data.get('password') || '');
    const confirmation = String(data.get('confirm') || '');
    if (password.length < 8) return passwordMessage('PASSWORD MUST HAVE AT LEAST 8 CHARACTERS');
    if (password !== confirmation) return passwordMessage('PASSWORDS DO NOT MATCH');
    try {
      localStorage.setItem(editPasswordKey, JSON.stringify(await makePasswordRecord(password)));
      ownerUnlocked = true;
      render();
      showToast('ACCESS KEY CREATED');
    } catch (_) {
      passwordMessage('OPEN THIS SITE ON LOCALHOST OR HTTPS TO SET A PASSWORD');
    }
    return;
  }
  if (form.id === 'password-login-form') {
    event.preventDefault();
    const password = String(new FormData(form).get('password') || '');
    try {
      if (await matchesPassword(password, readEditPassword())) {
        ownerUnlocked = true;
        render();
        showToast('PROFILE UNLOCKED');
      } else {
        passwordMessage('INCORRECT PASSWORD / ACCESS DENIED');
        form.reset();
        form.querySelector('input')?.focus();
      }
    } catch (_) {
      passwordMessage('PASSWORD CHECK FAILED / TRY AGAIN');
    }
    return;
  }
  if (form.id === 'password-change-form') {
    event.preventDefault();
    const data = new FormData(form);
    const current = String(data.get('current') || '');
    const password = String(data.get('password') || '');
    const confirmation = String(data.get('confirm') || '');
    try {
      if (!await matchesPassword(current, readEditPassword())) return passwordMessage('CURRENT PASSWORD IS INCORRECT');
      if (password.length < 8) return passwordMessage('NEW PASSWORD MUST HAVE AT LEAST 8 CHARACTERS');
      if (password !== confirmation) return passwordMessage('NEW PASSWORDS DO NOT MATCH');
      localStorage.setItem(editPasswordKey, JSON.stringify(await makePasswordRecord(password)));
      form.reset();
      passwordMessage('PASSWORD UPDATED / SAVED IN THIS BROWSER');
      showToast('ACCESS KEY UPDATED');
    } catch (_) {
      passwordMessage('PASSWORD UPDATE FAILED / TRY AGAIN');
    }
    return;
  }
  if (form.id !== 'profile-form') return;
  event.preventDefault();
  const formData = new FormData(form);
  for (const [key, value] of formData.entries()) saveProfileValue(key, String(value).trim());
  showToast('PROFILE SAVED · SIGNAL UPDATED');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
  if (event.key === 'Tab' && menu.classList.contains('is-open')) {
    const focusable = [...menu.querySelectorAll('a[href], button:not([disabled])')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

window.addEventListener('hashchange', () => {
  if (!['configure', 'manage'].includes(currentRoute())) ownerUnlocked = false;
  closeMenu();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function updateClock() {
  const now = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
  const clock = document.querySelector('#clock');
  if (clock) clock.textContent = `${now} UTC+03`;
}

function startMatrixRain() {
  const canvas = document.querySelector('#matrix-rain');
  const intro = document.querySelector('#matrix-intro');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) {
    intro?.classList.add('is-done');
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    intro?.classList.add('is-done');
    canvas.style.display = 'none';
    return;
  }

  canvas.classList.add('is-booting');
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let drops = [];
  let lastFrame = 0;
  const fontSize = 16;

  function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.fillStyle = '#03080d';
    context.fillRect(0, 0, width, height);
    drops = Array.from({ length: Math.ceil(width / fontSize) }, () => Math.random() * height / fontSize);
  }

  function drawFrame(time) {
    if (time - lastFrame < 32) {
      window.requestAnimationFrame(drawFrame);
      return;
    }
    lastFrame = time;
    if (!document.hidden) {
      context.fillStyle = 'rgba(3, 8, 13, .12)';
      context.fillRect(0, 0, width, height);
      context.font = `600 ${fontSize}px monospace`;
      context.textBaseline = 'top';
      drops.forEach((drop, column) => {
        const bright = Math.random() > .965;
        context.fillStyle = bright ? 'rgba(174, 236, 255, .85)' : `rgba(55, 194, 255, ${.3 + Math.random() * .46})`;
        context.fillText(Math.random() > .5 ? '1' : '0', column * fontSize, drop * fontSize);
        if (drop * fontSize > height && Math.random() > .972) drops[column] = 0;
        else drops[column] += .72 + Math.random() * .48;
      });
    }
    window.requestAnimationFrame(drawFrame);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.requestAnimationFrame(drawFrame);
  window.setTimeout(() => {
    intro?.classList.add('is-done');
    canvas.classList.remove('is-booting');
  }, 1450);
}

if (!location.hash) history.replaceState(null, '', '#/home');
render();
startMatrixRain();
updateClock();
setInterval(updateClock, 1000);
