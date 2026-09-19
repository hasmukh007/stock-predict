<?php
// backend/index.php

// 1. CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Parse request URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = trim($uri, '/');

// Auto initialize database
require_once __DIR__ . '/config/database.php';
try {
    Database::getConnection();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Route mapping
if (empty($uri) || $uri === 'index.php' || $uri === 'api' || $uri === 'api/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'healthy',
        'service' => 'StockPredict REST Engine',
        'timestamp' => date('Y-m-d H:i:s'),
        'version' => '1.0.0'
    ]);
    exit;
}

// Map /api/<resource> to backend/api/<resource>.php
if (preg_match('#^api/([a-zA-Z0-9_-]+)(\.php)?#', $uri, $matches)) {
    $resource = $matches[1];
    $apiFile = __DIR__ . "/api/{$resource}.php";
    if (file_exists($apiFile)) {
        require $apiFile;
        exit;
    }
}

// Fallback 404
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => "Endpoint not found: {$uri}"]);
