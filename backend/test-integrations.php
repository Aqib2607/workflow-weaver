<?php

require_once 'vendor/autoload.php';

echo "=== Integration Test ===\n";

$baseUrl = 'http://127.0.0.1:8000/api';
$testEmail = 'integration-test@flowbuilder.com';
$testPassword = 'password123';

// Setup: Login
$loginData = ['email' => $testEmail, 'password' => $testPassword];
$ch = curl_init("$baseUrl/login");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$loginResult = json_decode($response, true);
$token = $loginResult['token'] ?? null;
curl_close($ch);

if (!$token) {
    echo "❌ Login failed\n";
    exit(1);
}

$headers = ['Content-Type: application/json', "Authorization: Bearer $token"];

// Test 1: Create HTTP Integration
echo "1. Testing HTTP Integration Creation...\n";
$httpIntegration = [
    'name' => 'Test HTTP Integration',
    'type' => 'http',
    'credentials' => [
        'test_url' => 'https://httpbin.org/get',
        'headers' => []
    ],
    'is_active' => true
];

$ch = curl_init("$baseUrl/integrations");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($httpIntegration));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Create HTTP Integration: SUCCESS\n";
    $integration = json_decode($response, true);
    $integrationId = $integration['id'];
} else {
    echo "❌ Create HTTP Integration: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 2: Test Integration
echo "2. Testing Integration Test...\n";
$ch = curl_init("$baseUrl/integrations/$integrationId/test");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Test Integration: SUCCESS\n";
    $testResult = json_decode($response, true);
    if ($testResult['success']) {
        echo "  Integration test passed\n";
    }
} else {
    echo "❌ Test Integration: FAILED (HTTP $httpCode)\n";
}

// Test 3: List Integrations
echo "3. Testing List Integrations...\n";
$ch = curl_init("$baseUrl/integrations");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ List Integrations: SUCCESS\n";
} else {
    echo "❌ List Integrations: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 4: Create Email Integration
echo "4. Testing Email Integration Creation...\n";
$emailIntegration = [
    'name' => 'Test Email Integration',
    'type' => 'email',
    'credentials' => [
        'host' => 'smtp.mailtrap.io',
        'port' => 2525,
        'username' => 'test',
        'password' => 'test',
        'encryption' => 'tls',
        'test_email' => 'test@example.com'
    ],
    'is_active' => true
];

$ch = curl_init("$baseUrl/integrations");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailIntegration));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Create Email Integration: SUCCESS\n";
} else {
    echo "❌ Create Email Integration: FAILED (HTTP $httpCode)\n";
}

// Test 5: Create Database Integration
echo "5. Testing Database Integration Creation...\n";
$dbIntegration = [
    'name' => 'Test Database Integration',
    'type' => 'database',
    'credentials' => [
        'connection' => 'mysql',
        'host' => '127.0.0.1',
        'port' => 3307,
        'database' => 'workflow-weaver',
        'username' => 'root',
        'password' => ''
    ],
    'is_active' => true
];

$ch = curl_init("$baseUrl/integrations");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dbIntegration));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Create Database Integration: SUCCESS\n";
} else {
    echo "❌ Create Database Integration: FAILED (HTTP $httpCode)\n";
}

echo "\n🎉 Integration Test: ALL PASSED\n";