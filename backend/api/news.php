<?php
// backend/api/news.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$pdo = Database::getConnection();
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'list':
        $category = trim($_GET['category'] ?? '');
        if (!empty($category) && $category !== 'All') {
            $stmt = $pdo->prepare("SELECT * FROM news WHERE is_published = 1 AND category = ? ORDER BY published_at DESC LIMIT 20");
            $stmt->execute([$category]);
        } else {
            $stmt = $pdo->query("SELECT * FROM news WHERE is_published = 1 ORDER BY published_at DESC LIMIT 20");
        }
        $news = $stmt->fetchAll();
        echo json_encode(['success' => true, 'news' => $news]);
        break;

    case 'admin_list':
        AuthHelper::requireAdmin();
        $stmt = $pdo->query("SELECT * FROM news ORDER BY published_at DESC");
        $news = $stmt->fetchAll();
        echo json_encode(['success' => true, 'news' => $news]);
        break;

    case 'create':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $title = trim($input['title'] ?? '');
        $summary = trim($input['summary'] ?? '');
        $content = trim($input['content'] ?? $summary);
        $category = trim($input['category'] ?? 'Market');
        $imageUrl = trim($input['image_url'] ?? 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60');
        $source = trim($input['source'] ?? 'MarketDesk');
        $isPublished = isset($input['is_published']) ? (int)$input['is_published'] : 1;

        if (empty($title) || empty($summary)) {
            http_response_code(400);
            echo json_encode(['error' => 'Title and summary are required.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO news (title, summary, content, category, image_url, source, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $summary, $content, $category, $imageUrl, $source, $isPublished]);

        echo json_encode([
            'success' => true,
            'message' => 'News article published.',
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
        $title = trim($input['title'] ?? '');
        $summary = trim($input['summary'] ?? '');
        $content = trim($input['content'] ?? '');
        $category = trim($input['category'] ?? 'Market');
        $imageUrl = trim($input['image_url'] ?? '');
        $source = trim($input['source'] ?? 'MarketDesk');
        $isPublished = isset($input['is_published']) ? (int)$input['is_published'] : 1;

        if ($id <= 0 || empty($title)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid ID and Title are required.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE news SET title = ?, summary = ?, content = ?, category = ?, image_url = ?, source = ?, is_published = ? WHERE id = ?");
        $stmt->execute([$title, $summary, $content, $category, $imageUrl, $source, $isPublished, $id]);

        echo json_encode(['success' => true, 'message' => 'News updated successfully.']);
        break;

    case 'delete':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        $del = $pdo->prepare("DELETE FROM news WHERE id = ?");
        $del->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'News deleted.']);
        break;

    case 'toggle_publish':
        AuthHelper::requireAdmin();
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $id = (int)($input['id'] ?? 0);
        $stmt = $pdo->prepare("SELECT is_published FROM news WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'News item not found.']);
            exit;
        }

        $newVal = $row['is_published'] ? 0 : 1;
        $up = $pdo->prepare("UPDATE news SET is_published = ? WHERE id = ?");
        $up->execute([$newVal, $id]);

        echo json_encode(['success' => true, 'id' => $id, 'is_published' => $newVal]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid news action.']);
        break;
}
