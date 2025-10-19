<?php
require_once(__DIR__ . '/../lib/utils.php');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Invalid request method', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if ($username === '' || $password === '') {
    json_error('Username and password are required', 400);
}

$stmt = $mysqli->prepare("SELECT id, username, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    json_error('User not found', 404);
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    json_error('Wrong password', 401);
}


//نثبت الجلسة
session_regenerate_id(true);
$_SESSION['user_id']   = (int)$user['id'];
$_SESSION['username']  = $user['username'];

//نسجل الاكشن كتسجيل دخول 
$details = json_encode([
    'user_id'  => (int)$user['id'],
    'username' => $user['username']
]);

log_action($mysqli, (int)$user['id'], 'auth.login', $details);


json_ok([
    'user_id'  => (int)$user['id'],
    'username' => $user['username']
], 'Login succefully ');
