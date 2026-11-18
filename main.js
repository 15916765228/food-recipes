

const LS_FAV = "food_favs";
const LS_USERS = "food_users";
const LS_USER = "food_user";
const LS_USER_RECIPES = "food_user_recipes";
const LS_HISTORY = "food_history";

const PLACEHOLDER = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#ffd9c0"/><stop offset="1" stop-color="#ff9a56"/>' +
  '</linearGradient></defs><rect width="400" height="300" fill="url(#g)"/>' +
  '<text x="200" y="180" font-size="72" text-anchor="middle">🍲</text></svg>'
);

document.addEventListener("error", function (e) {
  const t = e.target;
  if (t && t.tagName === "IMG" && !t.dataset.fallback) {
    t.dataset.fallback = "1";
    t.src = PLACEHOLDER;
  }
}, true);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function showToast(msg) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}
function nowText() {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getFavs() { try { return JSON.parse(localStorage.getItem(LS_FAV)) || []; } catch (e) { return []; } }
function saveFavs(ids) { localStorage.setItem(LS_FAV, JSON.stringify(ids)); }
function isFav(id) { return getFavs().map(String).includes(String(id)); }
function toggleFav(id) {
  let favs = getFavs().map(String);
  const s = String(id);
  if (favs.includes(s)) favs = favs.filter(x => x !== s); else favs.push(s);
  saveFavs(favs);
  return favs.includes(s);
}

function getUsers() { try { return JSON.parse(localStorage.getItem(LS_USERS)) || {}; } catch (e) { return {}; } }
function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }
function getCurrentUser() { try { return JSON.parse(localStorage.getItem(LS_USER)); } catch (e) { return null; } }
function setCurrentUser(u) { if (u) localStorage.setItem(LS_USER, JSON.stringify(u)); else localStorage.removeItem(LS_USER); }
function currentName() { const u = getCurrentUser(); return u ? u.name : ""; }

function getUserRecipes() { try { return JSON.parse(localStorage.getItem(LS_USER_RECIPES)) || []; } catch (e) { return []; } }
function saveUserRecipes(list) { localStorage.setItem(LS_USER_RECIPES, JSON.stringify(list)); }
function getAllRecipes() { return RECIPES.concat(getUserRecipes()); }

function ratingKey(id) { return "food_ratings_" + id; }
function getRatings(id) { try { return JSON.parse(localStorage.getItem(ratingKey(id))) || {}; } catch (e) { return {}; } }
function avgRating(id) {
  const rs = getRatings(id);
  const vals = Object.values(rs).filter(v => typeof v === "number" && v > 0);
  if (!vals.length) return { avg: 0, count: 0 };
  return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length };
}
function myRating(id) { const n = currentName(); const rs = getRatings(id); return (n && rs[n]) ? rs[n] : 0; }
function saveRating(id, score) {
  const n = currentName();
  if (!n) return false;
  const rs = getRatings(id);
  rs[n] = score;
  localStorage.setItem(ratingKey(id), JSON.stringify(rs));
  return true;
}

function getHistory() { try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; } catch (e) { return []; } }
function addHistory(id) {
  let h = getHistory().map(String).filter(x => x !== String(id));
  h.unshift(String(id));
  h = h.slice(0, 12);
  localStorage.setItem(LS_HISTORY, JSON.stringify(h));
}

function commentKey(id) { return "food_comments_" + id; }
function getComments(id) { try { return JSON.parse(localStorage.getItem(commentKey(id))) || []; } catch (e) { return []; } }
function saveComments(id, cs) { localStorage.setItem(commentKey(id), JSON.stringify(cs)); }

function renderComments(id) {
  const list = document.getElementById("comment-list");
  if (!list) return;
  const cs = getComments(id);
  list.innerHTML = cs.length
    ? cs.map(c => `
      <div class="comment-item">
        <div class="who"><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(c.time)}</span></div>
        <p>${escapeHtml(c.text)}</p>
      </div>`).join("")
    : `<p class="empty">还没有评论，快来分享你的做法吧～</p>`;
}

function updateNavUser() {
  const el = document.querySelector(".nav-user");
  if (!el) return;
  const u = getCurrentUser();
  el.textContent = u ? "👤 " + u.name : "登录 / 注册";
}

function cardHTML(r) {
  const fav = isFav(r.id);
  const { avg } = avgRating(r.id);
  return `
  <article class="card">
    <div class="card-img">
      <a href="detail.html?id=${encodeURIComponent(r.id)}"><img src="${r.image}" alt="${escapeHtml(r.name)}" loading="lazy"></a>
      <button class="fav-btn ${fav ? 'on' : ''}" data-fav="${r.id}" title="收藏">${fav ? '❤️' : '🤍'}</button>
    </div>
    <div class="card-body">
      <h3><a href="detail.html?id=${encodeURIComponent(r.id)}">${escapeHtml(r.name)}</a></h3>
      <p class="desc">${escapeHtml(r.desc)}</p>
      <div class="card-meta">
        <span class="tag cat">${escapeHtml(r.category)}</span>
        <span class="tag">⏱ ${escapeHtml(r.time)}</span>
        <span class="tag">🔥 ${escapeHtml(r.difficulty)}</span>
        <span class="tag">⭐ ${avg ? avg.toFixed(1) : '—'}</span>
      </div>
    </div>
  </article>`;
}

function renderRating(id) {
  const box = document.getElementById("rating-box");
  if (!box) return;
  const { avg, count } = avgRating(id);
  const mine = myRating(id);
  const filled = Math.round(avg);
  box.innerHTML = `
    <div class="rating-stars">
      ${[1, 2, 3, 4, 5].map(n => `<span class="star ${n <= filled ? 'on' : ''}" data-rate="${n}" data-rate-id="${encodeURIComponent(id)}" title="给这道菜评分">★</span>`).join("")}
    </div>
    <div class="rating-meta">
      <span class="rating-text">${count ? `<strong>${avg.toFixed(1)}</strong> 分 · ${count} 人评分` : "暂无评分，来做第一个打分的人吧"}</span>
      ${mine ? `<span class="my-rate">我的评分：${"★".repeat(mine)}${"☆".repeat(5 - mine)}</span>` : ""}
    </div>`;
}

function renderHome() {
  const grid = document.getElementById("hot-grid");
  if (grid) {
    const hot = [...getAllRecipes()].sort((a, b) => b.likes - a.likes).slice(0, 6);
    grid.innerHTML = hot.map(cardHTML).join("");
  }
  const form = document.getElementById("home-search");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const kw = document.getElementById("home-search-input").value.trim();
      location.href = "recipes.html" + (kw ? "?q=" + encodeURIComponent(kw) : "");
    });
  }
}

let currentCat = "全部";
let currentKw = "";

function renderChips() {
  const box = document.getElementById("chips");
  if (!box) return;
  box.innerHTML = CATEGORIES.map(c =>
    `<button class="chip ${c === currentCat ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join("");
}

function renderRecipes() {
  const grid = document.getElementById("card-grid");
  if (!grid) return;
  let list = getAllRecipes().filter(r => currentCat === "全部" || r.category === currentCat);
  if (currentKw) {
    const kw = currentKw.toLowerCase();
    list = list.filter(r =>
      String(r.name).toLowerCase().includes(kw) ||
      String(r.desc).toLowerCase().includes(kw) ||
      String(r.category).includes(kw) ||
      r.ingredients.join(" ").toLowerCase().includes(kw)
    );
  }
  const countEl = document.getElementById("result-count");
  if (countEl) countEl.textContent = `共 ${list.length} 道菜谱`;
  grid.innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<p class="empty">没有找到相关菜谱，换个关键词试试～</p>`;
}

function initRecipes() {
  currentKw = (new URLSearchParams(location.search).get("q") || "").trim();
  renderChips();
  renderRecipes();

  const inp = document.getElementById("page-search");
  if (inp) inp.value = currentKw;

  document.getElementById("chips")?.addEventListener("click", e => {
    const chip = e.target.closest("[data-cat]");
    if (!chip) return;
    currentCat = chip.dataset.cat;
    renderChips();
    renderRecipes();
  });

  const form = document.getElementById("page-search-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      currentKw = (document.getElementById("page-search").value || "").trim();
      renderRecipes();
    });
  }
}

function splitIng(item) {
  const idx = String(item).search(/\s/);
  return idx > 0 ? [item.slice(0, idx), item.slice(idx + 1)] : [item, ""];
}

function renderDetail() {
  const head = document.getElementById("detail-head");
  if (!head) return;
  const idParam = new URLSearchParams(location.search).get("id");
  const all = getAllRecipes();
  const r = all.find(x => String(x.id) === String(idParam)) || all[0];
  document.title = r.name + " · 美食食谱分享平台";
  addHistory(r.id);

  const fav = isFav(r.id);
  const liked = localStorage.getItem("food_liked_" + r.id) === "1";
  const likes = r.likes + (liked ? 1 : 0);
  const minutes = (String(r.time).match(/\d+/) || ["—"])[0];

  head.innerHTML = `
    <div class="detail-img"><img src="${r.image}" alt="${escapeHtml(r.name)}"></div>
    <div class="detail-info">
      <span class="cat-tag">${escapeHtml(r.category)}</span>
      <h1>${escapeHtml(r.name)}</h1>
      <p class="desc">${escapeHtml(r.desc)}</p>
      ${r.author ? `<p class="byline">分享者：${escapeHtml(r.author)}</p>` : ""}
      <div class="detail-stats">
        <div><strong>${minutes}</strong><span>分钟</span></div>
        <div><strong>${escapeHtml(r.difficulty)}</strong><span>难度</span></div>
        <div><strong id="like-count">${likes}</strong><span>点赞</span></div>
      </div>
      <div class="rating-box" id="rating-box"></div>
      <div class="detail-actions">
        <button class="btn btn-primary" id="like-btn">${liked ? '👍 已点赞' : '👍 点赞'}</button>
        <button class="btn btn-fav ${fav ? 'on' : ''}" id="detail-fav">${fav ? '❤️ 已收藏' : '🤍 收藏'}</button>
      </div>
    </div>`;

  const body = document.getElementById("detail-body");
  if (body) {
    body.innerHTML = `
      <div class="panel">
        <h2>食材清单</h2>
        <ul class="ingredients">
          ${r.ingredients.map(i => { const [a, b] = splitIng(i); return `<li><span>${escapeHtml(a)}</span><span>${escapeHtml(b)}</span></li>`; }).join("")}
        </ul>
      </div>
      <div class="panel">
        <h2>制作步骤</h2>
        <ol class="steps">${r.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
        <div class="tips-box"><strong>💡 小贴士：</strong>${escapeHtml(r.tips)}</div>
      </div>`;
  }

  document.getElementById("like-btn")?.addEventListener("click", function () {
    if (liked) { showToast("你已经点过赞啦"); return; }
    liked = true;
    localStorage.setItem("food_liked_" + r.id, "1");
    this.textContent = "👍 已点赞";
    document.getElementById("like-count").textContent = r.likes + 1;
    showToast("点赞成功");
  });

  document.getElementById("detail-fav")?.addEventListener("click", function () {
    const on = toggleFav(r.id);
    this.classList.toggle("on", on);
    this.textContent = on ? "❤️ 已收藏" : "🤍 收藏";
    showToast(on ? "已加入收藏" : "已取消收藏");
  });

  renderRating(r.id);
  renderComments(r.id);

  const form = document.getElementById("comment-form");
  if (form) {
    const nameInput = document.getElementById("c-name");
    if (nameInput && currentName()) nameInput.value = currentName();
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = (document.getElementById("c-name").value || "").trim() || currentName() || "匿名食客";
      const text = (document.getElementById("c-text").value || "").trim();
      if (!text) { showToast("请输入评论内容"); return; }
      const cs = getComments(r.id);
      cs.unshift({ name, text, time: nowText() });
      saveComments(r.id, cs);
      document.getElementById("c-text").value = "";
      renderComments(r.id);
      showToast("评论发表成功");
    });
  }
}

function renderFavorites() {
  const grid = document.getElementById("fav-grid");
  if (!grid) return;
  const list = getAllRecipes().filter(r => isFav(r.id));
  const countEl = document.getElementById("fav-count");
  if (countEl) countEl.textContent = `已收藏 ${list.length} 道菜谱`;
  grid.innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<p class="empty">你还没有收藏任何菜谱，去 <a href="recipes.html" style="color:#ff6b35">菜谱库</a> 逛逛吧～</p>`;
}

function readImageFile(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const max = 900;
      let w = img.width, h = img.height;
      if (w > max) { h = Math.round(h * max / w); w = max; }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => showToast("图片读取失败，请换一张");
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function initPublish() {
  const form = document.getElementById("pub-form");
  if (!form) return;
  let imgData = "";
  const fileInput = document.getElementById("pub-img");
  const preview = document.getElementById("pub-preview");

  fileInput?.addEventListener("change", e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { showToast("请选择图片文件"); return; }
    readImageFile(f, url => {
      imgData = url;
      if (preview) { preview.src = url; preview.hidden = false; }
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const u = getCurrentUser();
    if (!u) { showToast("请先登录再发布菜谱"); setTimeout(() => location.href = "login.html", 900); return; }

    const name = document.getElementById("pub-name").value.trim();
    const category = document.getElementById("pub-cat").value;
    const difficulty = document.getElementById("pub-diff").value;
    const time = document.getElementById("pub-time").value.trim() || "30 分钟";
    const desc = document.getElementById("pub-desc").value.trim();
    const ingRaw = document.getElementById("pub-ing").value.trim();
    const stepsRaw = document.getElementById("pub-steps").value.trim();
    const tips = document.getElementById("pub-tips").value.trim();

    if (!name || !ingRaw || !stepsRaw) { showToast("菜名、食材、步骤为必填项"); return; }
    const ingredients = ingRaw.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const steps = stepsRaw.split(/\n+/).map(s => s.trim()).filter(Boolean);
    if (!ingredients.length || !steps.length) { showToast("食材和步骤至少要各填一项"); return; }

    const recipe = {
      id: "u" + Date.now(),
      name, category, difficulty, time,
      desc: desc || "用户分享的一道家常好菜。",
      likes: 0,
      ingredients, steps,
      tips: tips || "暂无小贴士。",
      image: imgData || PLACEHOLDER,
      author: u.name
    };
    const list = getUserRecipes();
    list.unshift(recipe);
    saveUserRecipes(list);
    showToast("发布成功！正在跳转…");
    setTimeout(() => location.href = "detail.html?id=" + encodeURIComponent(recipe.id), 900);
  });
}

let pTab = "favs";

function myLikedRecipes() {
  return getAllRecipes().filter(r => localStorage.getItem("food_liked_" + r.id) === "1");
}
function myComments(u) {
  const out = [];
  getAllRecipes().forEach(r => {
    getComments(r.id).forEach(c => { if (c.name === u.name) out.push(Object.assign({}, c, { recipe: r })); });
  });
  return out;
}
function myRecipes(u) { return getUserRecipes().filter(r => r.author === u.name); }

function renderProfileStats(u) {
  const box = document.getElementById("profile-stats");
  if (!box) return;
  const items = [
    ["收藏", getFavs().length],
    ["点赞", myLikedRecipes().length],
    ["评论", myComments(u).length],
    ["投稿", myRecipes(u).length]
  ];
  box.innerHTML = items.map(([k, v]) => `<div class="stat-card"><strong>${v}</strong><span>${k}</span></div>`).join("");
}

function renderProfileTab(u) {
  const box = document.getElementById("profile-content");
  if (!box) return;
  if (pTab === "favs") {
    const list = getAllRecipes().filter(r => isFav(r.id));
    box.innerHTML = list.length ? `<div class="card-grid">${list.map(cardHTML).join("")}</div>` : `<p class="empty">还没有收藏任何菜谱，去菜谱库逛逛吧～</p>`;
  } else if (pTab === "likes") {
    const list = myLikedRecipes();
    box.innerHTML = list.length ? `<div class="card-grid">${list.map(cardHTML).join("")}</div>` : `<p class="empty">还没有点赞过菜谱～</p>`;
  } else if (pTab === "recipes") {
    const list = myRecipes(u);
    box.innerHTML = list.length ? `<div class="card-grid">${list.map(cardHTML).join("")}</div>` : `<p class="empty">还没有投稿，去 <a class="link" href="publish.html">发布一道菜</a> 吧～</p>`;
  } else if (pTab === "comments") {
    const list = myComments(u);
    box.innerHTML = list.length ? `<div class="comment-list">${list.map(c => `
      <div class="comment-item">
        <div class="who"><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(c.time)}</span></div>
        <p>${escapeHtml(c.text)}</p>
        <a class="to-recipe" href="detail.html?id=${encodeURIComponent(c.recipe.id)}">来自《${escapeHtml(c.recipe.name)}》</a>
      </div>`).join("")}</div>` : `<p class="empty">还没有发表过评论～</p>`;
  } else if (pTab === "history") {
    const ids = getHistory();
    const list = ids.map(i => getAllRecipes().find(r => String(r.id) === String(i))).filter(Boolean);
    box.innerHTML = list.length ? `<div class="card-grid">${list.map(cardHTML).join("")}</div>` : `<p class="empty">还没有浏览记录～</p>`;
  }
}

function initProfile() {
  const u = getCurrentUser();
  const guest = document.getElementById("profile-guest");
  const mainEl = document.getElementById("profile-main");
  if (!u) {
    if (guest) guest.hidden = false;
    if (mainEl) mainEl.hidden = true;
    return;
  }
  if (guest) guest.hidden = true;
  if (mainEl) mainEl.hidden = false;

  const av = document.getElementById("profile-avatar");
  if (av) av.textContent = u.name.slice(0, 1).toUpperCase();
  const nm = document.getElementById("profile-name");
  if (nm) nm.textContent = u.name;

  renderProfileStats(u);

  document.querySelectorAll("[data-ptab]").forEach(b => {
    b.addEventListener("click", () => {
      pTab = b.dataset.ptab;
      document.querySelectorAll("[data-ptab]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      renderProfileTab(u);
    });
  });
  renderProfileTab(u);

  document.getElementById("profile-logout")?.addEventListener("click", () => {
    setCurrentUser(null);
    showToast("已退出登录");
    setTimeout(() => location.reload(), 700);
  });
}

function initLogin() {
  const tabs = document.querySelectorAll(".auth-tab");
  const loginForm = document.getElementById("login-form");
  const regForm = document.getElementById("register-form");
  const msg = document.getElementById("auth-msg");
  const loggedBox = document.getElementById("logged-in");
  const loggedText = document.getElementById("logged-text");

  function showMsg(text, ok) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = "auth-msg " + (ok ? "ok" : "err");
  }

  function renderLogged() {
    const u = getCurrentUser();
    const isLogin = !!u;
    if (loggedBox) loggedBox.style.display = isLogin ? "block" : "none";
    if (loginForm) loginForm.style.display = isLogin ? "none" : "flex";
    if (regForm) regForm.style.display = "none";
    if (tabs[0]) tabs[0].parentElement.style.display = isLogin ? "none" : "flex";
    if (loggedText && u) loggedText.innerHTML = `已登录为 <strong>${escapeHtml(u.name)}</strong>`;
    if (isLogin) msg.textContent = "";
    msg.className = "auth-msg";
  }
  renderLogged();

  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    const isLogin = t.dataset.tab === "login";
    loginForm.style.display = isLogin ? "flex" : "none";
    regForm.style.display = isLogin ? "none" : "flex";
    msg.textContent = "";
    msg.className = "auth-msg";
  }));

  loginForm?.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("login-name").value.trim();
    const pwd = document.getElementById("login-pwd").value;
    if (!name || !pwd) { showMsg("请填写昵称和密码", false); return; }
    const users = getUsers();
    if (!users[name]) { showMsg("该昵称尚未注册，请先注册", false); return; }
    if (users[name] !== pwd) { showMsg("密码不正确，请重试", false); return; }
    setCurrentUser({ name });
    showMsg("登录成功，欢迎回来！", true);
    updateNavUser();
    setTimeout(renderLogged, 500);
  });

  regForm?.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const pwd = document.getElementById("reg-pwd").value;
    const pwd2 = document.getElementById("reg-pwd2").value;
    if (!name || !pwd) { showMsg("昵称和密码不能为空", false); return; }
    if (pwd.length < 6) { showMsg("密码至少 6 位", false); return; }
    if (pwd !== pwd2) { showMsg("两次输入的密码不一致", false); return; }
    const users = getUsers();
    if (users[name]) { showMsg("该昵称已被注册，换一个吧", false); return; }
    users[name] = pwd;
    saveUsers(users);
    setCurrentUser({ name });
    showMsg("注册成功，已自动登录！", true);
    updateNavUser();
    setTimeout(renderLogged, 500);
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    setCurrentUser(null);
    updateNavUser();
    renderLogged();
    showMsg("已退出登录", true);
  });
}

document.addEventListener("click", e => {
  const favBtn = e.target.closest("[data-fav]");
  if (favBtn) {
    const on = toggleFav(favBtn.dataset.fav);
    favBtn.classList.toggle("on", on);
    favBtn.textContent = on ? "❤️" : "🤍";
    showToast(on ? "已加入收藏" : "已取消收藏");
    if (document.body.dataset.page === "favorites") renderFavorites();
    if (document.body.dataset.page === "profile") {
      const u = getCurrentUser();
      if (u) { renderProfileStats(u); if (pTab === "favs" || pTab === "likes") renderProfileTab(u); }
    }
    return;
  }
  const star = e.target.closest("[data-rate]");
  if (star) {
    if (!currentName()) {
      showToast("登录后才能评分");
      setTimeout(() => location.href = "login.html", 900);
      return;
    }
    const id = decodeURIComponent(star.dataset.rateId);
    const n = parseInt(star.dataset.rate, 10);
    saveRating(id, n);
    renderRating(id);
    showToast("已评分 " + n + " 星");
    return;
  }
});

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem("food_theme", t);
  const btn = document.querySelector(".theme-toggle");
  if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
}
function initTheme() {
  const saved = localStorage.getItem("food_theme") || "light";
  applyTheme(saved);
  const nav = document.querySelector(".nav-inner");
  if (nav && !document.querySelector(".theme-toggle")) {
    const btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.title = "切换深色 / 浅色模式";
    btn.textContent = saved === "dark" ? "☀️" : "🌙";
    btn.addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(cur);
      showToast(cur === "dark" ? "已开启深色模式" : "已关闭深色模式");
    });
    nav.appendChild(btn);
    applyTheme(saved);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateNavUser();
  const page = document.body.dataset.page;
  if (page === "home") renderHome();
  if (page === "recipes") initRecipes();
  if (page === "detail") renderDetail();
  if (page === "favorites") renderFavorites();
  if (page === "login") initLogin();
  if (page === "publish") initPublish();
  if (page === "profile") initProfile();
});
