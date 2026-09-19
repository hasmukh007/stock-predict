<?php
// backend/helpers/jwt.php

class AuthHelper {
    private static string $secretKey = 'stockpredict_super_secret_jwt_key_2026_xyz!@#';

    public static function generateToken(array $payload, int $expirySeconds = 86400 * 7): string {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['exp'] = time() + $expirySeconds;
        $payload['iat'] = time();

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secretKey, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function validateToken(?string $token): ?array {
        if (!$token) {
            return null;
        }

        // Remove 'Bearer ' if present
        if (str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        $validSignature = self::base64UrlEncode(
            hash_hmac('sha256', $header . "." . $payload, self::$secretKey, true)
        );

        if (!hash_equals($validSignature, $signature)) {
            return null;
        }

        $decodedPayload = json_decode(self::base64UrlDecode($payload), true);
        if (!$decodedPayload || !isset($decodedPayload['exp'])) {
            return null;
        }

        if ($decodedPayload['exp'] < time()) {
            return null; // Expired
        }

        return $decodedPayload;
    }

    public static function getAuthenticatedUser(): ?array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }

        return self::validateToken($authHeader);
    }

    public static function requireAuth(): array {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized. Please log in.']);
            exit;
        }
        return $user;
    }

    public static function requireAdmin(): array {
        $user = self::requireAuth();
        if (($user['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin privileges required.']);
            exit;
        }
        return $user;
    }

    private static function base64UrlEncode(string $data): string {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode(string $data): string {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}
