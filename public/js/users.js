// beacause we will use it multible times so we use as a const
const API_BASE   = `${location.origin}/user_manager/api/users.php`;
const LOGOUT_API = '../api/logout.php';

// storing page elements
const tableBody = document.querySelector('#usersTable tbody');
const form = document.getElementById('addUserForm');
const alertBox = document.getElementById('alert');

//UI helpers تنبيهات
function showAlert(msg){
  alertBox.textContent = msg;
  alertBox.classList.add('show');
  setTimeout(()=> alertBox.classList.remove('show'), 4000);
}

//دالة جلب المستخدمين
async function loadUsers() {
  const res = await fetch(`${API_BASE}?t=${Date.now()}`);
  const data = await res.json();

  // اذا غير مسموح يطلع 401 ويرجع لوقين
  if (res.status === 401) { location.href = 'index.html'; return; }

  if (!res.ok || data.status !== 'success') {
    showAlert(data.message || 'Failed to load users');
    return;
  }
  tableBody.innerHTML = "";
  data.data.forEach(u => {
    const row = document.createElement("tr");

    // نخلق خلايا قابلة للتحرير
    const idTd = document.createElement('td'); idTd.textContent = u.id;
    const nameTd = document.createElement('td'); nameTd.textContent = u.name; nameTd.contentEditable = "true";
    const ageTd = document.createElement('td'); ageTd.textContent = u.age; ageTd.contentEditable = "true";
    const emailTd = document.createElement('td'); emailTd.textContent = u.email; emailTd.contentEditable = "true";

    // أزرار الايديت والديليت
    const actionsTd = document.createElement('td'); actionsTd.className = 'actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--primary';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => toggleEdit(row, editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--danger';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => deleteUser(u.id);

    //تجميع الصف
    actionsTd.append(editBtn, delBtn);
    row.append(idTd, nameTd, ageTd, emailTd, actionsTd);

    // قيم أصلية لزر Cancel
    row.dataset.origName = u.name;
    row.dataset.origAge = u.age;
    row.dataset.origEmail = u.email;

    tableBody.appendChild(row);
  });
}

//اضافة مستخدم
form.addEventListener("submit", async e => {
  e.preventDefault(); //زي الاول نوقف التحميل بعد الارسال عشان نرسل ajax
  const name = form.name.value.trim();
  const age = +form.age.value.trim();
  const email = form.email.value.trim();
  if (!name || !age || !email) return showAlert("All fields required");

  try {
    //ارسل للسيرفر
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age, email })
    });

    if (res.status === 401) { location.href = 'index.html'; return; }

    // حل مشكلة ان احيانا السيرفر يرجع html 
    //مشكلة ان الايميل مكرر بدون تحذير 
    let out = {};
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      out = await res.json();
    } else {
      const txt = await res.text(); //نقراه كنص ثم نبني ااوبجكت يدويا
      out = { status: 'error', message: (res.status === 409 ? 'Email already exists' : (txt || 'Insert failed')) };
    }

    if (!res.ok || out.status !== 'success') {
      showAlert(out.message || 'Insert failed');
      return;
    }

    form.reset(); // نرجع النموذج فارغ 
    await loadUsers();
  } catch (err) {
    showAlert('Connection error');
  }
});



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

// جلب كل المستخدمين
loadUsers();