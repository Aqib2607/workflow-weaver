<?php

require_once 'vendor/autoload.php';

echo "=== Workflow CRUD Test ===\n";

$baseUrl = 'http://127.0.0.1:8000/api';
$testEmail = 'workflow-test@flowbuilder.com';
$testPassword = 'password123';

// Login first
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
    echo "❌ Login failed, cannot proceed with workflow tests\n";
    exit(1);
}

$headers = [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
];

// Test 1: Create Workflow
echo "1. Testing Workflow Creation...\n";
$workflowData = [
    'name' => 'Test Workflow',
    'description' => 'A test workflow for CRUD operations',
    'is_active' => true
];

$ch = curl_init("$baseUrl/workflows");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($workflowData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Create Workflow: SUCCESS\n";
    $workflow = json_decode($response, true);
    $workflowId = $workflow['id'];
} else {
    echo "❌ Create Workflow: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 2: Read Workflow
echo "2. Testing Workflow Read...\n";
$ch = curl_init("$baseUrl/workflows/$workflowId");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Read Workflow: SUCCESS\n";
} else {
    echo "❌ Read Workflow: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 3: Update Workflow
echo "3. Testing Workflow Update...\n";
$updateData = ['name' => 'Updated Test Workflow'];

$ch = curl_init("$baseUrl/workflows/$workflowId");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Update Workflow: SUCCESS\n";
} else {
    echo "❌ Update Workflow: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 4: List Workflows
echo "4. Testing Workflow List...\n";
$ch = curl_init("$baseUrl/workflows");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ List Workflows: SUCCESS\n";
} else {
    echo "❌ List Workflows: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 5: Delete Workflow
echo "5. Testing Workflow Delete...\n";
$ch = curl_init("$baseUrl/workflows/$workflowId");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Delete Workflow: SUCCESS\n";
} else {
    echo "❌ Delete Workflow: FAILED (HTTP $httpCode)\n";
    exit(1);
}

echo "\n🎉 Workflow CRUD Test: ALL PASSED\n";