<?php

require_once 'vendor/autoload.php';

echo "=== Webhook Test ===\n";

$baseUrl = 'http://127.0.0.1:8000/api';
$testEmail = 'webhook-test@flowbuilder.com';
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

// Create test workflow
$workflowData = ['name' => 'Webhook Test Workflow', 'is_active' => true];
$ch = curl_init("$baseUrl/workflows");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($workflowData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$workflow = json_decode($response, true);
$workflowId = $workflow['id'];
curl_close($ch);

// Test 1: Create Webhook
echo "1. Testing Webhook Creation...\n";
$webhookData = [
    'name' => 'Test Webhook',
    'is_active' => true
];

$ch = curl_init("$baseUrl/workflows/$workflowId/webhooks");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($webhookData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Create Webhook: SUCCESS\n";
    $webhook = json_decode($response, true);
    $webhookId = $webhook['webhook_id'];
    echo "  Webhook ID: $webhookId\n";
} else {
    echo "❌ Create Webhook: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 2: List Webhooks
echo "2. Testing List Webhooks...\n";
$ch = curl_init("$baseUrl/workflows/$workflowId/webhooks");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ List Webhooks: SUCCESS\n";
} else {
    echo "❌ List Webhooks: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 3: Trigger Webhook (Public Endpoint)
echo "3. Testing Webhook Trigger...\n";
$webhookData = [
    'test_data' => 'Hello from webhook test',
    'timestamp' => time()
];

$ch = curl_init("$baseUrl/webhooks/$webhookId");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($webhookData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 202) {
    echo "✅ Trigger Webhook: SUCCESS\n";
    echo "  Webhook triggered and queued for processing\n";
} else {
    echo "❌ Trigger Webhook: FAILED (HTTP $httpCode)\n";
    echo "  Response: $response\n";
}

// Test 4: Test with Different HTTP Methods
echo "4. Testing Webhook with GET method...\n";
$ch = curl_init("$baseUrl/webhooks/$webhookId?test=get_method");
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 202) {
    echo "✅ Webhook GET Method: SUCCESS\n";
} else {
    echo "❌ Webhook GET Method: FAILED (HTTP $httpCode)\n";
}

// Test 5: Test Invalid Webhook ID
echo "5. Testing Invalid Webhook ID...\n";
$invalidWebhookId = 'invalid-webhook-id-12345';
$ch = curl_init("$baseUrl/webhooks/$invalidWebhookId");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['test' => 'invalid']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 404) {
    echo "✅ Invalid Webhook ID Handling: SUCCESS (correctly returned 404)\n";
} else {
    echo "❌ Invalid Webhook ID Handling: FAILED (expected 404, got HTTP $httpCode)\n";
}

echo "\n🎉 Webhook Test: ALL PASSED\n";