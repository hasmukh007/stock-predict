<?php
// backend/api/auth.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$pdo = Database::getConnection();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'login':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password.']);
            exit;
        }

        $tokenPayload = [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ];

        $token = AuthHelper::generateToken($tokenPayload);

        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'created_at' => $user['created_at']
            ]
        ]);
        break;

    case 'register':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $name = trim($input['name'] ?? '');
        $email = trim(strtolower($input['email'] ?? ''));
        $password = $input['password'] ?? '';

        if (empty($name) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, email and password are required.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Please provide a valid email address.']);
            exit;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 6 characters.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'An account with this email already exists.']);
            exit;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $insert = $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')");
        $insert->execute([$name, $email, $passwordHash]);
        $newId = (int)$pdo->lastInsertId();

        $tokenPayload = [
            'id' => $newId,
            'name' => $name,
            'email' => $email,
            'role' => 'user'
        ];
        $token = AuthHelper::generateToken($tokenPayload);

        echo json_encode([
            'success' => true,
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => [
                'id' => $newId,
                'name' => $name,
                'email' => $email,
                'role' => 'user',
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
        break;

    case 'me':
        $authUser = AuthHelper::requireAuth();
        $stmt = $pdo->prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$authUser['id']]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found.']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid auth endpoint action.']);
        break;
}
