<?php
require_once(__DIR__ . '/../config.php');


function json_ok($data = [], $message = 'OK') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

function json_error($message = 'An error occurred', $code = 400) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'error',
        'message' => $message
    ]);
    exit;
}

function log_action($mysqli, $user_id, $action, $details = null) {
    $stmt = $mysqli->prepare("INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user_id, $action, $details);
    $stmt->execute();
    $stmt->close();
}
