# User Manager — PHP + MySQL + AJAX

**Author:** Ahmad Hammad  
**Date:** October 2025

A compact project that demonstrates **session-based login**, **AJAX CRUD** on users, and an **audit log**.  
**Important design note:** In this project, **email is UNIQUE** to prevent duplicates, **but login is by *username***.  
Only the **initial admin** (inserted manually) has `username` + `password` and can log in. Users added from the UI have only **name / age / email** and **cannot log in** (their `username`/`password` are `NULL`).

---

## Tech Stack & Key Features
- **PHP 7.4+/8.x**, **MySQL/MariaDB**, **HTML/CSS/JavaScript**
- **Session-based authentication** with `password_hash()` / `password_verify()`
- **AJAX** for login and all CRUD actions (no page reloads)
- **Logs** for: `auth.login`, `user.add`, `user.update`, `user.delete`, `auth.logout`
- **JSON** responses from all backend endpoints

---

## Folder Structure
```
user_manager/
├── config.php
├── lib/
│   └── utils.php
├── api/
│   ├── auth.php        # Login (username + password) → creates PHP session, returns JSON
│   ├── users.php       # CRUD on users (requires session)
│   ├── logs.php        # Read logs (requires session)
│   └── logout.php      # Destroys session, returns JSON
└── public/
    ├── index.html      # Login page (AJAX)
    ├── users.html      # Users table + inline edit/delete (AJAX)
    ├── logs.html       # Logs table (AJAX)
    └── assets/
        ├── css/
        │   └── style.css
        │   
        └── js/
            ├── login.js   # Handles login form submission (AJAX)
            ├── users.js  # Loads/adds/edits/deletes users (AJAX)
            └── logs.js   # Loads logs (AJAX)
```
> If your file names differ, keep the same *roles* (one JS for auth, one for users, one for logs).

---

## How to Run Locally

1) Place `user_manager` under your web root, e.g.:
   - Windows (XAMPP): `C:\xampp\htdocs\user_manager`
   - Linux/macOS (Apache): `/var/www/html/user_manager`

2) Start **Apache** and **MySQL**.

3) Create a database named `user_manager` and **import** `database.sql` (phpMyAdmin → Import).

4) Edit `user_manager/config.php` with your DB credentials:
```php
<?php
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';         // your MySQL password if any
$DB_NAME = 'user_manager';
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
```
> Ensure no PHP warnings/notices leak to output; all endpoints must return valid JSON.

5) Open the app:
```
http://localhost/user_manager/public/index.html
```

---

## Default Admin (Username Login) — Create a Password Hash

Generate a hash for the default admin password. **Two quick options:**

**A) PHP CLI (recommended):**
```bash
php -r "echo password_hash('admin123', PASSWORD_DEFAULT) . PHP_EOL;"
```
Copy the output hash and paste it into `database.sql` (replace `REPLACE_WITH_HASH`).

**B) Temporary PHP file (if no CLI):**
Create `public/hash.php`:
```php
<?php echo password_hash('admin123', PASSWORD_DEFAULT);
```
Open `http://localhost/user_manager/public/hash.php`, copy the hash, then delete the file.

---

## Database Schema (also in `database.sql`)

- `email` is **UNIQUE**, used for identifying UI-created users (not for login).
- `username`/`password` exist **only** for the initial admin (login account).

```sql
CREATE DATABASE IF NOT EXISTS user_manager;
USE user_manager;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NULL,         -- used only for admin login
  password VARCHAR(255) NULL,         -- used only for admin login
  name VARCHAR(150),
  age INT,
  email VARCHAR(150) UNIQUE,          -- unique constraint for UI-added users
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Default admin (replace REPLACE_WITH_HASH with your generated hash)
INSERT INTO users (username, password, name, age, email)
VALUES ('admin', 'REPLACE_WITH_HASH', 'Admin', 30, 'admin@example.com');
```

---

## API Contract (Quick Reference)

### Auth
- `POST /api/auth.php`
  - Request JSON: `{ "username": "admin", "password": "admin123" }`
  - Responses:
    - Success → `{"status":"success","data":{"user_id":1,"username":"admin"}}`
    - Errors  → `{"status":"error","message":"User not found" | "Wrong password" | "Username and password are required"}`
  - Side-effect: Starts a PHP session and sets `$_SESSION['user_id']`, `$_SESSION['username']`.

### Users (requires session)
- `GET /api/users.php` → list users (id, name, age, email, created_at)
- `POST /api/users.php` → add `{ name, age, email }` (email must be unique)
- `PUT /api/users.php` → update `{ id, name, age, email }`
- `DELETE /api/users.php` → delete `{ id }`

> UI-created users **do not** have `username/password` and **cannot** log in. Only the admin row is used for login.

### Logs (requires session)
- `GET /api/logs.php` → list logs: `id, username (joined), action, details, created_at`

### Logout
- `POST /api/logout.php` → destroys the session:
  - Response: `{"status":"success","message":"Logged out"}`

---

## Demo Script (3–5 minutes)

1. Open `index.html` → login by **username** (`admin`) and password (AJAX, no reload).  
2. Go to `users.html` → **Add** a user (name/age/email) → appears instantly.  
3. **Edit** a row inline → Save → refreshes via AJAX.  
4. **Delete** a row → disappears instantly.  
5. Open `logs.html` → show `auth.login`, `user.add`, `user.update`, `user.delete`, `auth.logout`.  
6. Logout → attempt to open `users.html` directly → backend 401 redirects to login.

---