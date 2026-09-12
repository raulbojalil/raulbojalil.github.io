"use strict";

/* =========================================================================
   CONFIGURATION — à personnaliser avant le déploiement.
   Voir README.md pour la procédure complète de création de l'identifiant
   OAuth dans Google Cloud Console.
   ========================================================================= */
const CONFIG = {
  CLIENT_ID: "793875939223-g6q1j3s71bg1eafr8f8rmubstic2ksr4.apps.googleusercontent.com",
  SCOPE: "https://www.googleapis.com/auth/drive.file",
  DRIVE_FOLDER_NAME: "RetroArch Saves",
};

/* =========================================================================
   ÉTAT
   ========================================================================= */
const state = {
  accessToken: null,
  tokenExpiresAt: 0,
  folderId: null,
  tokenClient: null,
  pendingFiles: [], // File[] en attente d'envoi (avec ._source / ._entryHandle éventuels)
  driveFiles: [],   // fichiers listés depuis Drive
  dirHandle: null,      // FileSystemDirectoryHandle lié, si disponible
  dirPermGranted: false,
};

const FSA_SUPPORTED = "showDirectoryPicker" in window;

/* =========================================================================
   RÉFÉRENCES DOM
   ========================================================================= */
const el = {
  authBtn: document.getElementById("authBtn"),
  statusPill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  fsaSection: document.getElementById("fsaSection"),
  linkFolderBtn: document.getElementById("linkFolderBtn"),
  reauthFolderBtn: document.getElementById("reauthFolderBtn"),
  rescanFolderBtn: document.getElementById("rescanFolderBtn"),
  unlinkFolderBtn: document.getElementById("unlinkFolderBtn"),
  fsaStatus: document.getElementById("fsaStatus"),
  pickFilesBtn: document.getElementById("pickFilesBtn"),
  pickFolderBtn: document.getElementById("pickFolderBtn"),
  fileInput: document.getElementById("fileInput"),
  folderInput: document.getElementById("folderInput"),
  localDropZone: document.getElementById("localDropZone"),
  localList: document.getElementById("localList"),
  localCount: document.getElementById("localCount"),
  uploadAllBtn: document.getElementById("uploadAllBtn"),
  driveList: document.getElementById("driveList"),
  driveCount: document.getElementById("driveCount"),
  driveHelp: document.getElementById("driveHelp"),
  refreshBtn: document.getElementById("refreshBtn"),
  logList: document.getElementById("logList"),
};

/* =========================================================================
   JOURNAL
   ========================================================================= */
function log(message, level = "info") {
  const li = document.createElement("li");
  li.className = level;
  const time = new Date().toLocaleTimeString("fr-FR");
  li.textContent = `${time}  ${message}`;
  el.logList.prepend(li);
  while (el.logList.children.length > 40) {
    el.logList.removeChild(el.logList.lastChild);
  }
}

/* =========================================================================
   UTILITAIRES
   ========================================================================= */
function formatSize(bytes) {
  if (bytes === undefined || bytes === null) return "";
  const n = Number(bytes);
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function setConnected(isConnected) {
  el.statusPill.classList.toggle("connected", isConnected);
  el.statusText.textContent = isConnected ? "Connecté" : "Non connecté";
  el.authBtn.textContent = isConnected ? "Se déconnecter" : "Se connecter avec Google";
  el.refreshBtn.disabled = !isConnected;
  if (!isConnected) {
    el.driveHelp.textContent =
      "Connectez-vous avec Google pour afficher et récupérer vos sauvegardes stockées dans le cloud.";
    el.driveList.innerHTML = '<div class="empty-state">Non connecté.</div>';
    el.driveCount.textContent = "—";
  }
}

/* =========================================================================
   AUTHENTIFICATION (Google Identity Services)
   ========================================================================= */
function initAuth() {
  if (typeof google === "undefined" || !google.accounts) {
    // Le script GIS charge en async ; on réessaie brièvement.
    setTimeout(initAuth, 200);
    return;
  }

  state.tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPE,
    callback: async (response) => {
      if (response.error) {
        log(`Échec de connexion : ${response.error}`, "err");
        return;
      }
      state.accessToken = response.access_token;
      state.tokenExpiresAt = Date.now() + (response.expires_in || 3600) * 1000;
      localStorage.setItem("ra_previously_signed_in", "1");
      setConnected(true);
      log("Connecté à Google Drive.", "ok");
      await ensureFolder();
      await refreshDriveList();
    },
  });

  // Reconnexion silencieuse si l'utilisateur s'était déjà connecté avant.
  if (localStorage.getItem("ra_previously_signed_in") === "1") {
    requestToken(""); // "" = tente sans afficher de consentement si déjà accordé
  }
}

function requestToken(prompt) {
  if (!state.tokenClient) {
    log("Le module d'authentification Google n'est pas encore prêt.", "err");
    return;
  }
  state.tokenClient.requestAccessToken({ prompt });
}

function signOut() {
  if (state.accessToken && google.accounts?.oauth2?.revoke) {
    google.accounts.oauth2.revoke(state.accessToken, () => {});
  }
  state.accessToken = null;
  state.tokenExpiresAt = 0;
  state.folderId = null;
  localStorage.removeItem("ra_previously_signed_in");
  setConnected(false);
  log("Déconnecté.", "info");
}

function isTokenValid() {
  return state.accessToken && Date.now() < state.tokenExpiresAt - 30000;
}

async function ensureValidToken() {
  if (isTokenValid()) return true;
  return new Promise((resolve) => {
    const originalCallback = state.tokenClient.callback;
    state.tokenClient.callback = (response) => {
      state.tokenClient.callback = originalCallback;
      originalCallback(response);
      resolve(!response.error);
    };
    state.tokenClient.requestAccessToken({ prompt: "" });
  });
}

el.authBtn.addEventListener("click", () => {
  if (isTokenValid()) {
    signOut();
  } else {
    requestToken("consent");
  }
});

/* =========================================================================
   APPELS À L'API GOOGLE DRIVE (REST, via fetch)
   ========================================================================= */
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

async function driveFetch(url, options = {}) {
  await ensureValidToken();
  const headers = Object.assign({}, options.headers, {
    Authorization: `Bearer ${state.accessToken}`,
  });
  const res = await fetch(url, Object.assign({}, options, { headers }));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Drive API ${res.status} : ${text.slice(0, 200)}`);
  }
  return res;
}

async function ensureFolder() {
  const q = encodeURIComponent(
    `name='${CONFIG.DRIVE_FOLDER_NAME.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const res = await driveFetch(`${DRIVE_API}/files?q=${q}&fields=files(id,name)`);
  const data = await res.json();

  if (data.files && data.files.length > 0) {
    state.folderId = data.files[0].id;
    return state.folderId;
  }

  const createRes = await driveFetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: CONFIG.DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const created = await createRes.json();
  state.folderId = created.id;
  log(`Dossier "${CONFIG.DRIVE_FOLDER_NAME}" créé dans Google Drive.`, "ok");
  return state.folderId;
}

async function listDriveFiles() {
  const q = encodeURIComponent(`'${state.folderId}' in parents and trashed=false`);
  const fields = encodeURIComponent("files(id,name,size,modifiedTime)");
  const res = await driveFetch(`${DRIVE_API}/files?q=${q}&fields=${fields}&orderBy=name`);
  const data = await res.json();
  return data.files || [];
}

async function findFileByName(name) {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and '${state.folderId}' in parents and trashed=false`
  );
  const res = await driveFetch(`${DRIVE_API}/files?q=${q}&fields=files(id,name)`);
  const data = await res.json();
  return data.files && data.files[0];
}

async function uploadNewFile(file) {
  const boundary = "-------ra_cloud_saves_" + Date.now();
  const metadata = { name: file.name, parents: [state.folderId] };
  const bytes = await file.arrayBuffer();

  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`,
    bytes,
    `\r\n--${boundary}--`,
  ]);

  await driveFetch(`${DRIVE_UPLOAD_API}/files?uploadType=multipart`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

async function updateFileContent(fileId, file) {
  await driveFetch(`${DRIVE_UPLOAD_API}/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
}

async function downloadDriveFile(fileId, fileName) {
  const res = await driveFetch(`${DRIVE_API}/files/${fileId}?alt=media`);
  const blob = await res.blob();

  if (state.dirHandle) {
    try {
      const granted = await ensureDirPermission(state.dirHandle, true);
      updateFsaUI();
      if (!granted) throw new Error("permission refusée");
      const fileHandle = await state.dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      log(`"${fileName}" écrit directement dans "${state.dirHandle.name}".`, "ok");
      await scanDirectory();
      return;
    } catch (e) {
      log(`Écriture directe impossible (${e.message}) — téléchargement classique utilisé.`, "info");
      // on continue vers le repli ci-dessous
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function deleteDriveFile(fileId) {
  await driveFetch(`${DRIVE_API}/files/${fileId}`, { method: "DELETE" });
}

/* =========================================================================
   FILE SYSTEM ACCESS API — accès direct au dossier de sauvegardes
   Supporté : Chrome/Edge desktop.
   Non supporté : Chrome/Firefox/Safari sur Android, Firefox desktop, Safari
   (tous conservent le sélecteur de fichiers classique en repli).
   ========================================================================= */

// --- Persistance du handle de dossier via IndexedDB (localStorage ne peut
//     pas stocker un FileSystemDirectoryHandle, IndexedDB le peut). ---
function openHandleDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ra_cloud_saves", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const req = tx.objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- Permissions ---
async function ensureDirPermission(handle, requestIfNeeded) {
  const opts = { mode: "readwrite" };
  let perm = await handle.queryPermission(opts);
  if (perm === "prompt" && requestIfNeeded) {
    perm = await handle.requestPermission(opts); // nécessite un geste utilisateur
  }
  state.dirPermGranted = perm === "granted";
  return state.dirPermGranted;
}

function updateFsaUI() {
  if (!FSA_SUPPORTED) {
    el.fsaSection.hidden = true;
    return;
  }
  el.fsaSection.hidden = false;

  if (!state.dirHandle) {
    el.linkFolderBtn.textContent = "Lier un dossier (accès direct)";
    el.reauthFolderBtn.hidden = true;
    el.rescanFolderBtn.hidden = true;
    el.unlinkFolderBtn.hidden = true;
    el.fsaStatus.textContent =
      "Fonctionne sur Chrome/Edge (ordinateur). Sur Android, Firefox ou Safari, utilisez le sélecteur de fichiers ci-dessous.";
    return;
  }

  el.linkFolderBtn.textContent = "Changer de dossier";
  el.unlinkFolderBtn.hidden = false;

  if (state.dirPermGranted) {
    el.reauthFolderBtn.hidden = true;
    el.rescanFolderBtn.hidden = false;
    el.fsaStatus.textContent = `Dossier lié : "${state.dirHandle.name}" — les téléchargements y seront écrits directement.`;
  } else {
    el.reauthFolderBtn.hidden = false;
    el.rescanFolderBtn.hidden = true;
    el.fsaStatus.textContent = `Dossier "${state.dirHandle.name}" lié précédemment — cliquez sur "Réautoriser l'accès" pour continuer.`;
  }
}

async function linkFolder() {
  try {
    const handle = await window.showDirectoryPicker({
      id: "retroarch-saves",
      mode: "readwrite",
      startIn: "downloads",
    });
    const granted = await ensureDirPermission(handle, true);
    state.dirHandle = handle;
    await idbSet("dirHandle", handle);
    updateFsaUI();
    if (granted) {
      await scanDirectory();
      log(`Dossier "${handle.name}" lié — accès direct activé.`, "ok");
    } else {
      log("Permission refusée pour le dossier choisi.", "err");
    }
  } catch (e) {
    if (e.name !== "AbortError") log(`Impossible de lier le dossier : ${e.message}`, "err");
  }
}

async function unlinkFolder() {
  state.dirHandle = null;
  state.dirPermGranted = false;
  await idbSet("dirHandle", null);
  state.pendingFiles = state.pendingFiles.filter((f) => f.__source !== "handle");
  updateFsaUI();
  renderLocalList();
  log("Dossier délié.", "info");
}

async function tryRestoreFolder() {
  if (!FSA_SUPPORTED) return;
  try {
    const handle = await idbGet("dirHandle");
    if (!handle) return;
    state.dirHandle = handle;
    // Ne PAS demander la permission ici : requestPermission() exige un geste
    // utilisateur. On vérifie seulement l'état actuel.
    const perm = await handle.queryPermission({ mode: "readwrite" });
    state.dirPermGranted = perm === "granted";
    updateFsaUI();
    if (state.dirPermGranted) {
      await scanDirectory();
      log(`Dossier "${handle.name}" reconnecté.`, "ok");
    } else {
      log(`Dossier "${handle.name}" lié précédemment. Cliquez sur "Réautoriser l'accès".`, "info");
    }
  } catch (e) {
    log(`Reconnexion au dossier impossible : ${e.message}`, "info");
  }
}

async function scanDirectory() {
  if (!state.dirHandle) return;
  const granted = await ensureDirPermission(state.dirHandle, true);
  updateFsaUI();
  if (!granted) {
    log("Permission du dossier non accordée.", "err");
    return;
  }

  state.pendingFiles = state.pendingFiles.filter((f) => f.__source !== "handle");
  for await (const entry of state.dirHandle.values()) {
    if (entry.kind !== "file") continue;
    const file = await entry.getFile();
    file.__source = "handle";
    file.__entryHandle = entry;
    state.pendingFiles.push(file);
  }
  renderLocalList();
}

el.linkFolderBtn.addEventListener("click", linkFolder);
el.unlinkFolderBtn.addEventListener("click", unlinkFolder);
el.rescanFolderBtn.addEventListener("click", scanDirectory);
el.reauthFolderBtn.addEventListener("click", async () => {
  const granted = await ensureDirPermission(state.dirHandle, true);
  updateFsaUI();
  if (granted) {
    await scanDirectory();
    log("Accès au dossier réautorisé.", "ok");
  } else {
    log("Permission toujours refusée.", "err");
  }
});

/* =========================================================================
   RENDU — panneau local
   ========================================================================= */
function renderLocalList() {
  el.localCount.textContent = `${state.pendingFiles.length} fichier${state.pendingFiles.length === 1 ? "" : "s"}`;
  el.uploadAllBtn.disabled = state.pendingFiles.length === 0 || !isTokenValid();

  if (state.pendingFiles.length === 0) {
    el.localList.innerHTML = '<div class="empty-state">Aucun fichier sélectionné pour l\'instant.</div>';
    return;
  }

  el.localList.innerHTML = "";
  state.pendingFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-row pending";
    row.innerHTML = `
      <span class="file-icon">▣</span>
      <span class="file-meta">
        <span class="file-name">${escapeHtml(file.name)}</span>
        <span class="file-sub">${formatSize(file.size)} · en attente
          <span class="source-tag">${file.__source === "handle" ? "dossier lié" : "sélectionné"}</span>
        </span>
      </span>
      <span class="file-actions">
        <button class="btn small remove-local" data-index="${index}">Retirer</button>
      </span>
    `;
    el.localList.appendChild(row);
  });

  el.localList.querySelectorAll(".remove-local").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      state.pendingFiles.splice(i, 1);
      renderLocalList();
    });
  });
}

function addPendingFiles(fileList) {
  const incoming = Array.from(fileList);
  incoming.forEach((file) => {
    if (!state.pendingFiles.some((f) => f.name === file.name && f.size === file.size)) {
      state.pendingFiles.push(file);
    }
  });
  renderLocalList();
  if (incoming.length > 0) {
    log(`${incoming.length} fichier(s) ajouté(s) à la file d'envoi.`, "info");
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* =========================================================================
   RENDU — panneau Google Drive
   ========================================================================= */
function renderDriveList() {
  el.driveCount.textContent = `${state.driveFiles.length} fichier${state.driveFiles.length === 1 ? "" : "s"}`;
  el.driveHelp.textContent = `Fichiers présents dans le dossier "${CONFIG.DRIVE_FOLDER_NAME}" de votre Google Drive.`;

  if (state.driveFiles.length === 0) {
    el.driveList.innerHTML = '<div class="empty-state">Aucune sauvegarde dans le Drive pour l\'instant.</div>';
    return;
  }

  el.driveList.innerHTML = "";
  state.driveFiles.forEach((file) => {
    const row = document.createElement("div");
    row.className = "file-row";
    row.innerHTML = `
      <span class="file-icon">▣</span>
      <span class="file-meta">
        <span class="file-name">${escapeHtml(file.name)}</span>
        <span class="file-sub">${formatSize(file.size)} · ${formatDate(file.modifiedTime)}</span>
      </span>
      <span class="file-actions">
        <button class="btn small dl-drive" data-id="${file.id}" data-name="${escapeHtml(file.name)}">Télécharger</button>
        <button class="btn small danger rm-drive" data-id="${file.id}" data-name="${escapeHtml(file.name)}">Suppr.</button>
      </span>
    `;
    el.driveList.appendChild(row);
  });

  el.driveList.querySelectorAll(".dl-drive").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await downloadDriveFile(btn.dataset.id, btn.dataset.name);
        log(`"${btn.dataset.name}" téléchargé.`, "ok");
      } catch (e) {
        log(`Échec du téléchargement de "${btn.dataset.name}" : ${e.message}`, "err");
      } finally {
        btn.disabled = false;
      }
    });
  });

  el.driveList.querySelectorAll(".rm-drive").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Supprimer "${btn.dataset.name}" du Drive ?`)) return;
      btn.disabled = true;
      try {
        await deleteDriveFile(btn.dataset.id);
        log(`"${btn.dataset.name}" supprimé du Drive.`, "ok");
        await refreshDriveList();
      } catch (e) {
        log(`Échec de la suppression de "${btn.dataset.name}" : ${e.message}`, "err");
        btn.disabled = false;
      }
    });
  });
}

async function refreshDriveList() {
  if (!isTokenValid()) return;
  el.refreshBtn.disabled = true;
  try {
    if (!state.folderId) await ensureFolder();
    state.driveFiles = await listDriveFiles();
    renderDriveList();
  } catch (e) {
    log(`Échec du chargement du Drive : ${e.message}`, "err");
  } finally {
    el.refreshBtn.disabled = false;
  }
}

/* =========================================================================
   ENVOI VERS LE DRIVE
   ========================================================================= */
async function uploadAllPending() {
  if (!isTokenValid()) {
    log("Connectez-vous d'abord à Google Drive.", "err");
    return;
  }
  el.uploadAllBtn.disabled = true;
  if (!state.folderId) await ensureFolder();

  const toSend = [...state.pendingFiles];
  for (const entry of toSend) {
    try {
      // Pour un fichier sourcé depuis un dossier lié, on relit le contenu au
      // dernier moment (le fichier a pu changer depuis la sélection/scan).
      const file = entry.__entryHandle ? await entry.__entryHandle.getFile() : entry;

      const existing = await findFileByName(entry.name);
      if (existing) {
        await updateFileContent(existing.id, file);
        log(`"${entry.name}" mis à jour dans le Drive.`, "ok");
      } else {
        await uploadNewFile(file);
        log(`"${entry.name}" envoyé vers le Drive.`, "ok");
      }
      state.pendingFiles = state.pendingFiles.filter((f) => f !== entry);
      renderLocalList();
    } catch (e) {
      log(`Échec de l'envoi de "${entry.name}" : ${e.message}`, "err");
    }
  }
  await refreshDriveList();
}

/* =========================================================================
   ÉVÉNEMENTS UI
   ========================================================================= */
el.pickFilesBtn.addEventListener("click", () => el.fileInput.click());
el.pickFolderBtn.addEventListener("click", () => el.folderInput.click());
el.fileInput.addEventListener("change", (e) => addPendingFiles(e.target.files));
el.folderInput.addEventListener("change", (e) => addPendingFiles(e.target.files));

["dragenter", "dragover"].forEach((evt) =>
  el.localDropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    el.localDropZone.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((evt) =>
  el.localDropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    el.localDropZone.classList.remove("dragover");
  })
);
el.localDropZone.addEventListener("drop", (e) => {
  if (e.dataTransfer?.files?.length) addPendingFiles(e.dataTransfer.files);
});

el.uploadAllBtn.addEventListener("click", uploadAllPending);
el.refreshBtn.addEventListener("click", refreshDriveList);

/* =========================================================================
   DÉMARRAGE
   ========================================================================= */
if (CONFIG.CLIENT_ID.startsWith("REMPLACER_PAR")) {
  log("⚠ Aucun CLIENT_ID Google configuré — voir README.md.", "err");
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((e) => log(`Service worker : ${e.message}`, "err"));
  });
}

initAuth();
updateFsaUI();
renderLocalList();
tryRestoreFolder();
