document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('loginMsg');

  try {
    const res = await fetch('../api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.status === 'success') {
      localStorage.setItem('username', data.data.username);
      localStorage.setItem('user_id', data.data.user_id);
      window.location.href = 'users.html';
    } else {
      msg.textContent = data.message;
      msg.style.color = 'red';
    }
  } catch (err) {
    msg.textContent = 'Connection error';
    msg.style.color = 'red';
  }
});
