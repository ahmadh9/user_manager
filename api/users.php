<?php
require_once(__DIR__ . '/../lib/utils.php');

session_start();
$current_user_id = $_SESSION['user_id'] ?? null;
$current_user_id = $_SESSION['user_id'] ?? null;

$method = $_SERVER['REQUEST_METHOD'];

/* ✅ حراسة موحّدة لكل العمليات (عدا OPTIONS) */
if ($method !== 'OPTIONS' && !$current_user_id) {
    json_error('Unauthorized', 401);
}
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    /* -----------------------------------------
       GET - عرض جميع المستخدمين
    ------------------------------------------ */
    case 'GET':
        $result = $mysqli->query("SELECT id, name, age, email, created_at FROM users ORDER BY id DESC");
        if (!$result) json_error('Failed to fetch users', 500);
        $users = [];
        while ($row = $result->fetch_assoc()) $users[] = $row;
        json_ok($users);
        break;

    /* -----------------------------------------
       POST - إضافة مستخدم جديد
    ------------------------------------------ */
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $name  = trim($input['name'] ?? '');
        $age   = intval($input['age'] ?? 0);
        $email = trim($input['email'] ?? '');

        if ($name === '' || $age <= 0 || $email === '') {
            $details = json_encode(['name'=>$name,'age'=>$age,'email'=>$email], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
            log_action($mysqli, $current_user_id, 'user.add.fail', $details);
            json_error('Invalid input data', 400);
        }

        $username = $email;

        $stmt = $mysqli->prepare("INSERT INTO users (name, age, email, username) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("siss", $name, $age, $email, $username);
        $stmt->execute();

        // فحص التكرار
        if ($stmt->errno === 1062) {
            $err = $stmt->error ?? '';
            $details = json_encode(['name'=>$name,'age'=>$age,'email'=>$email,'error'=>$err], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
            log_action($mysqli, $current_user_id, 'user.add.fail', $details);

            if (stripos($err, 'uq_users_email') !== false) json_error('Email already exists', 409);
            if (stripos($err, 'uq_users_username') !== false) json_error('Username already exists', 409);
            json_error('Duplicate value', 409);
        }

        // تسجيل نجاح الإضافة
        if ($stmt->affected_rows > 0) {
            $details = json_encode([
                'id' => $stmt->insert_id,
                'name' => $name,
                'age' => $age,
                'email' => $email
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            log_action($mysqli, $current_user_id, 'user.add', $details);
            json_ok(['id'=>$stmt->insert_id,'name'=>$name,'age'=>$age,'email'=>$email], 'User added');
        } else {
            json_error('Insert failed', 500);
        }
        break;

    /* -----------------------------------------
       PUT - تعديل بيانات مستخدم
    ------------------------------------------ */
    case 'PUT':
        $input=json_decode(file_get_contents('php://input'),true);
        $id=intval($input['id']??0);
        $name=trim($input['name']??'');
        $age=intval($input['age']??0);
        $email=trim($input['email']??'');

        if($id<=0||$name===''||$age<=0||$email===''){
            $details = json_encode(['id'=>$id,'name'=>$name,'age'=>$age,'email'=>$email], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
            log_action($mysqli, $current_user_id, 'user.update.fail', $details);
            json_error('Invalid data',400);
        }

        $stmt=$mysqli->prepare("UPDATE users SET name=?,age=?,email=? WHERE id=?");
        $stmt->bind_param("sisi",$name,$age,$email,$id);
        $stmt->execute();

        $details = json_encode(['id'=>$id,'name'=>$name,'age'=>$age,'email'=>$email], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        log_action($mysqli, $current_user_id, 'user.update', $details);
        json_ok(['id'=>$id],'User updated');
        break;

    /* -----------------------------------------
       DELETE - حذف مستخدم
    ------------------------------------------ */
    case 'DELETE':
        $input=json_decode(file_get_contents('php://input'),true);
        $id=intval($input['id']??0);
        if($id<=0){
            $details = json_encode(['id'=>$id], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
            log_action($mysqli, $current_user_id, 'user.delete.fail', $details);
            json_error('Invalid id',400);
        }

        $stmt=$mysqli->prepare("DELETE FROM users WHERE id=?");
        $stmt->bind_param("i",$id);
        $stmt->execute();

        $details = json_encode(['id'=>$id], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        log_action($mysqli, $current_user_id, 'user.delete', $details);

        json_ok(['id'=>$id],'User deleted');
        break;

    /* -----------------------------------------
       OPTIONS - Preflight
    ------------------------------------------ */
    case 'OPTIONS':
        header('Content-Type: application/json; charset=utf-8');
        exit;

    default:
        json_error('Unsupported method',405);
}
