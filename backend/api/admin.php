<?php
// backend/api/admin.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';

header('Content-Type: application/json');

AuthHelper::requireAdmin();

$action = $_GET['action'] ?? 'stats';
$pdo = Database::getConnection();

switch ($action) {
    case 'stats':
        $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $totalStocks = (int)$pdo->query("SELECT COUNT(*) FROM stocks")->fetchColumn();
        $allowedStocks = (int)$pdo->query("SELECT COUNT(*) FROM stocks WHERE is_allowed = 1")->fetchColumn();
        $totalAnalyses = (int)$pdo->query("SELECT COUNT(*) FROM analyses")->fetchColumn();
        $homeFeaturedAnalyses = (int)$pdo->query("SELECT COUNT(*) FROM analyses WHERE is_visible_on_home = 1")->fetchColumn();
        $totalNews = (int)$pdo->query("SELECT COUNT(*) FROM news")->fetchColumn();
        $totalHolidays = (int)$pdo->query("SELECT COUNT(*) FROM holidays")->fetchColumn();

        // Top analyzed stocks
        $topStocks = $pdo->query("
            SELECT symbol, COUNT(*) as count
            FROM analyses
            GROUP BY symbol
            ORDER BY count DESC
            LIMIT 5
        ")->fetchAll();

        // Recent users
        $recentUsers = $pdo->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5")->fetchAll();

        echo json_encode([
            'success' => true,
            'stats' => [
                'total_users' => $totalUsers,
                'total_stocks' => $totalStocks,
                'allowed_stocks' => $allowedStocks,
                'total_analyses' => $totalAnalyses,
                'home_featured_analyses' => $homeFeaturedAnalyses,
                'total_news' => $totalNews,
                'total_holidays' => $totalHolidays,
                'top_stocks' => $topStocks,
                'recent_users' => $recentUsers
            ]
        ]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid admin action.']);
        break;
}
