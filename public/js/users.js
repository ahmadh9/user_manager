// ====== Config ======
const API_BASE   = `${location.origin}/user_manager/api/users.php`;
const LOGOUT_API = '../api/logout.php';
const REQUIRE_AUTH = true; // حماية واجهة خفيفة

// ====== Optional front-guard ======
if (REQUIRE_AUTH && !localStorage.getItem('user_id')) {
  const btn = document.getElementById('logoutBtn');
  if (btn) { btn.textContent = 'Login'; btn.onclick = () => location.href = 'index.html'; }
  location.href = 'index.html';
}

// ====== Elements ======
const tableBody = document.querySelector('#usersTable tbody');
const form = document.getElementById('addUserForm');
const alertBox = document.getElementById('alert');

// ====== UI helpers ======
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

// ====== Data loaders ======
async function loadUsers() {
  const res = await fetch(`${API_BASE}?t=${Date.now()}`);
  const data = await res.json();

  // ✅ انتهت الجلسة؟ رجّع للـ index
  if (res.status === 401) { location.href = 'index.html'; return; }

  if (!res.ok || data.status !== 'success') {
    showAlert(data.message || 'Failed to load users');
    return;
  }
  tableBody.innerHTML = "";
  data.data.forEach(u => {
    const row = document.createElement("tr");

    // خلايا
    const idTd = document.createElement('td'); idTd.textContent = u.id;
    const nameTd = document.createElement('td'); nameTd.textContent = u.name; nameTd.contentEditable = "true";
    const ageTd = document.createElement('td'); ageTd.textContent = u.age; ageTd.contentEditable = "true";
    const emailTd = document.createElement('td'); emailTd.textContent = u.email; emailTd.contentEditable = "true";

    // أزرار
    const actionsTd = document.createElement('td'); actionsTd.className = 'actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--primary';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => toggleEdit(row, editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--danger';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => deleteUser(u.id);

    actionsTd.append(editBtn, delBtn);
    row.append(idTd, nameTd, ageTd, emailTd, actionsTd);

    // قيم أصلية لزر Cancel
    row.dataset.origName = u.name;
    row.dataset.origAge = u.age;
    row.dataset.origEmail = u.email;

    tableBody.appendChild(row);
  });
}

// ====== Add User ======
form.addEventListener("submit", async e => {
  e.preventDefault();
  const name = form.name.value.trim();
  const age = +form.age.value.trim();
  const email = form.email.value.trim();
  if (!name || !age || !email) return showAlert("All fields required");

  const res = await fetch(API_BASE,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name,age,email})
  });
  const out = await res.json();

  if (res.status === 401) { location.href = 'index.html'; return; }

  if(!res.ok || out.status!=='success'){
    showAlert(out.message || 'Insert failed');
    return;
  }
  form.reset();
  await loadUsers();
});

// ====== Edit row UX ======
function toggleEdit(row, btn){
  const isEditing = row.classList.contains('editing');

  // اسمح بس لصف واحد يكون في وضع التعديل
  document.querySelectorAll('tr.editing').forEach(r=>{
    if(r!==row) exitEdit(r);
  });

  if(!isEditing){
    row.classList.add('editing');
    btn.textContent = 'Save';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn--ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
      row.cells[1].textContent = row.dataset.origName;
      row.cells[2].textContent = row.dataset.origAge;
      row.cells[3].textContent = row.dataset.origEmail;
      exitEdit(row);
    };
    btn.after(cancelBtn);
    btn.dataset.hasCancel = "1";
    row.cells[1].focus();
  }else{
    updateUser(row, btn);
  }
}

function exitEdit(row){
  row.classList.remove('editing');
  const editBtn = row.querySelector('.btn.btn--primary');
  if(editBtn){ editBtn.textContent = 'Edit'; editBtn.classList.remove('saving'); }
  if(editBtn && editBtn.dataset.hasCancel === "1"){
    const cancelBtn = editBtn.nextElementSibling;
    if(cancelBtn) cancelBtn.remove();
    delete editBtn.dataset.hasCancel;
  }
}

// ====== Update User ======
async function updateUser(row, btn){
  const id = +row.cells[0].textContent.trim();
  const name = row.cells[1].textContent.trim();
  const age  = +row.cells[2].textContent.trim();
  const email= row.cells[3].textContent.trim();

  if(!id || !name || !age || !email) return showAlert('Invalid data');
  btn.classList.add('saving');

  const res = await fetch(API_BASE,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,name,age,email})
  });
  const out = await res.json();

  if (res.status === 401) { location.href = 'index.html'; return; }

  if(!res.ok || out.status!=='success'){
    showAlert(out.message || 'Update failed');
    btn.classList.remove('saving');
    return;
  }
  row.dataset.origName = name;
  row.dataset.origAge  = age;
  row.dataset.origEmail= email;

  exitEdit(row);
  await loadUsers();
}

// ====== Delete User ======
async function deleteUser(id){
  if(!confirm("Delete user?")) return;
  const res = await fetch(API_BASE,{
    method:"DELETE",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id})
  });
  const out = await res.json();

  if (res.status === 401) { location.href = 'index.html'; return; }

  if(!res.ok || out.status!=='success'){
    showAlert(out.message || 'Delete failed');
    return;
  }
  await loadUsers();
}

// ====== Bootstrap ======
loadUsers();
