<?php
require_once(__DIR__ . '/../lib/utils.php');

session_start();
$current_user_id = $_SESSION['user_id'] ?? null;
$method          = $_SERVER['REQUEST_METHOD'];

//prtection
if ($method !== 'OPTIONS' && !$current_user_id) {
    json_error('Unauthorized', 401);
}

switch ($method) {

    case 'GET':
        $result = $mysqli->query("SELECT id, name, age, email, created_at FROM users ORDER BY id DESC");
        if (!$result) json_error('Failed to fetch users', 500);

        // اختصار بناء المصفوفة ترجع بشكل اعمدة 
        $users = $result->fetch_all(MYSQLI_ASSOC); 
        json_ok($users);
        break;


    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $name  = trim($input['name']  ?? '');
        $age   = (int)($input['age']  ?? 0);
        $email = trim($input['email'] ?? '');

        if ($name === '' || $age <= 0 || $email === '') {
            $details = json_encode(['name'=>$name,'age'=>$age,'email'=>$email]);
            log_action($mysqli, $current_user_id, 'user.add.fail', $details);
            json_error('Invalid input data', 400);
        }

        // حل مشكلة عدم ظهور تنبيه ان الايميل مكرر
        $dup = $mysqli->prepare("SELECT 1 FROM users WHERE email = ? LIMIT 1");
        $dup->bind_param("s", $email);
        $dup->execute();
        $dup->store_result();
        if ($dup->num_rows > 0) {
            $details = json_encode(['name'=>$name,'age'=>$age,'email'=>$email]);
            log_action($mysqli, $current_user_id, 'user.add.fail', $details);
            json_error('Email already exists', 409);
        }
        $dup->close();

        $stmt = $mysqli->prepare("INSERT INTO users (name, age, email) VALUES (?, ?, ?)");
        $stmt->bind_param("sis", $name, $age, $email);
        // dealing with errors
        if (!$stmt->execute()) {
            $err     = $stmt->error ?: ($mysqli->error ?? '');
            $details = json_encode(['name'=>$name,'age'=>$age,'email'=>$email,'error'=>$err]);
            log_action($mysqli, $current_user_id, 'user.add.fail', $details);

            if ($stmt->errno === 1062 || $mysqli->errno === 1062) {
                json_error('Email already exists', 409);
            }
            json_error('Insert failed', 500);
        }

        if ($stmt->affected_rows > 0) {
            $payload = ['id'=>$stmt->insert_id,'name'=>$name,'age'=>$age,'email'=>$email];
            log_action($mysqli, $current_user_id, 'user.add', json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
            json_ok($payload, 'User added');
        } else {
            json_error('Insert failed', 500);
        }
        break;

   
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $id    = (int)($input['id']    ?? 0);
        $name  = trim($input['name']   ?? '');
        $age   = (int)($input['age']   ?? 0);
        $email = trim($input['email']  ?? '');

        if ($id <= 0 || $name === '' || $age <= 0 || $email === '') {
            $details = json_encode(['id'=>$id,'name'=>$name,'age'=>$age,'email'=>$email]);
            log_action($mysqli, $current_user_id, 'user.update.fail', $details);
            json_error('Invalid data', 400);
        }

        $stmt = $mysqli->prepare("UPDATE users SET name=?, age=?, email=? WHERE id=?");
        $stmt->bind_param("sisi", $name, $age, $email, $id);
        $stmt->execute();

        $details = json_encode(['id'=>$id,'name'=>$name,'age'=>$age,'email'=>$email]);
        log_action($mysqli, $current_user_id, 'user.update', $details);
        json_ok(['id'=>$id], 'User updated');
        break;

    
    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        $id    = (int)($input['id'] ?? 0);

        if ($id <= 0) {
            $details = json_encode(['id'=>$id]);
            log_action($mysqli, $current_user_id, 'user.delete.fail', $details);
            json_error('Invalid id', 400);
        }

        $stmt = $mysqli->prepare("DELETE FROM users WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        log_action($mysqli, $current_user_id, 'user.delete', json_encode(['id'=>$id]));
        json_ok(['id'=>$id], 'User deleted');
        break;


    case 'OPTIONS':
        header('Content-Type: application/json; charset=utf-8');
        exit;

    default:
        json_error('Unsupported method', 405);
}
