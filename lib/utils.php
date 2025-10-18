<?php
require_once(__DIR__ . '/../config.php');

// 🧠 نوقف أي إخراج سابق أو بفر مؤجل (مهم جدًا لتحديث الـ fetch فورًا)
if (ob_get_level()) {
    ob_end_clean();
}

// 🛡️ نمنع الكاش والمتصفح من الاحتفاظ بأي نسخة قديمة
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// 🌐 نسمح للـ Fetch بالعمل بحرية (خصوصًا في Chrome)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

// 🧾 تسجيل الأحداث (إضافة / حذف / تعديل / تسجيل دخول)
function log_action($mysqli, $user_id, $action, $details = null) {
    $stmt = $mysqli->prepare("INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user_id, $action, $details);
    $stmt->execute();
    $stmt->close();
}
