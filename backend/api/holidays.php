<?php
// backend/api/holidays.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'upcoming';
$pdo = Database::getConnection();
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'upcoming':
        // Today or upcoming holidays
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT * FROM holidays WHERE holiday_date >= ? ORDER BY holiday_date ASC LIMIT 10");
        $stmt->execute([$today]);
        $holidays = $stmt->fetchAll();

        // If none found for future, return all holidays sorted
        if (empty($holidays)) {
            $holidays = $pdo->query("SELECT * FROM holidays ORDER BY holiday_date ASC LIMIT 10")->fetchAll();
        }

        // Calculate days remaining
        foreach ($holidays as &$h) {
            $diff = strtotime($h['holiday_date']) - strtotime($today);
            $h['days_until'] = max(0, (int)ceil($diff / 86400));
        }

        echo json_encode(['success' => true, 'holidays' => $holidays]);
        break;

    case 'admin_list':
        AuthHelper::requireAdmin();
        $stmt = $pdo->query("SELECT * FROM holidays ORDER BY holiday_date ASC");
        $holidays = $stmt->fetchAll();
        echo json_encode(['success' => true, 'holidays' => $holidays]);
        break;

    case 'create':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $name = trim($input['name'] ?? '');
        $date = trim($input['holiday_date'] ?? '');
        $exchange = trim($input['exchange'] ?? 'NYSE/NASDAQ');
        $status = trim($input['status'] ?? 'closed');
        $notes = trim($input['notes'] ?? '');

        if (empty($name) || empty($date)) {
            http_response_code(400);
            echo json_encode(['error' => 'Holiday name and date are required.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO holidays (name, holiday_date, exchange, status, notes) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $date, $exchange, $status, $notes]);

        echo json_encode([
            'success' => true,
            'message' => 'Holiday created successfully.',
            'id' => (int)$pdo->lastInsertId()
        ]);
        break;

    case 'update':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $date = trim($input['holiday_date'] ?? '');
        $exchange = trim($input['exchange'] ?? 'NYSE/NASDAQ');
        $status = trim($input['status'] ?? 'closed');
        $notes = trim($input['notes'] ?? '');

        if ($id <= 0 || empty($name) || empty($date)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid ID, name, and date are required.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE holidays SET name = ?, holiday_date = ?, exchange = ?, status = ?, notes = ? WHERE id = ?");
        $stmt->execute([$name, $date, $exchange, $status, $notes, $id]);

        echo json_encode(['success' => true, 'message' => 'Holiday updated successfully.']);
        break;

    case 'delete':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        $del = $pdo->prepare("DELETE FROM holidays WHERE id = ?");
        $del->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Holiday deleted.']);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid holidays action.']);
        break;
}
