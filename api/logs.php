<?php
require_once(__DIR__ . '/../lib/utils.php');

if (session_status() === PHP_SESSION_NONE) { session_start(); }
if (!isset($_SESSION['user_id'])) { json_error('Unauthorized', 401); } // ⬅️ حارس السشن

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Invalid request method', 405);
}

$query = "
    SELECT 
        logs.id,
        users.username,
        logs.action,
        logs.details,
        logs.created_at
    FROM logs
    LEFT JOIN users ON logs.user_id = users.id
    ORDER BY logs.id DESC
";

$result = $mysqli->query($query);
if (!$result) {
    json_error('Failed to fetch logs', 500);
}

$logs = [];
while ($row = $result->fetch_assoc()) {
    $logs[] = $row;
}

json_ok($logs, 'Logs fetched successfully');
