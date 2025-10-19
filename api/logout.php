<?php
require_once(__DIR__ . '/../lib/utils.php');

if (session_status() === PHP_SESSION_NONE) session_start();

$uid = $_SESSION['user_id'] ?? null;
if ($uid) {
    $details = json_encode(['user_id'=>(int)$uid,'username'=>($_SESSION['username']??null)]);
    log_action($mysqli, (int)$uid, 'auth.logout', $details);
}


$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time()-42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}
session_destroy();

json_ok([], 'Logged out');
