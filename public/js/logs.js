// ====== Config ======
const LOGS_API   = '../api/logs.php';
const LOGOUT_API = '../api/logout.php';
const REQUIRE_AUTH = true; // حماية واجهة خفيفة

// ====== Optional front-guard ======
if (REQUIRE_AUTH && !localStorage.getItem('user_id')) {
  const btn = document.getElementById('logoutBtn');
  if (btn) { btn.textContent = 'Login'; btn.onclick = () => location.href = 'index.html'; }
  location.href = 'index.html';
}

// ====== UI helpers ======
const alertBox = document.getElementById('alert');
function showAlert(msg){
  alertBox.textContent = msg;
  alertBox.classList.add('show');
  setTimeout(()=> alertBox.classList.remove('show'), 4000);
}

function setupAuthButton(){
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  const loggedIn = !!localStorage.getItem('user_id');

  if (loggedIn) {
    btn.textContent = 'Logout';
    if (btn.dataset.bound !== '1') {
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        try { await fetch(LOGOUT_API, { method: 'POST' }); } catch(_) {}
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        location.href = 'index.html';
      }, { once: true });
    }
  } else {
    btn.textContent = 'Login';
    btn.onclick = () => { location.href = 'index.html'; };
  }
}
setupAuthButton();

// ====== Data loader ======
async function loadLogs() {
  const res = await fetch(LOGS_API + '?t=' + Date.now());
  const data = await res.json();

  if (res.status === 401) { location.href = 'index.html'; return; }

  if(!res.ok || data.status!=='success'){
    showAlert(data.message || 'Failed to fetch logs');
    return;
  }

  const tbody = document.querySelector('#logsTable tbody');
  tbody.innerHTML = '';

  data.data.forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.id}</td>
      <td>${log.username ?? 'Unknown'}</td>
      <td>${log.action}</td>
      <td>${log.details ?? ''}</td>
      <td>${log.created_at}</td>
    `;
    tbody.appendChild(row);
  });
}

// ====== Bootstrap ======
loadLogs();

