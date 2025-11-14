<?php

require_once 'vendor/autoload.php';

echo "=== Node Management Test ===\n";

$baseUrl = 'http://127.0.0.1:8000/api';
$testEmail = 'node-test@flowbuilder.com';
$testPassword = 'password123';

// Setup: Login and create workflow
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
$workflowData = ['name' => 'Node Test Workflow', 'description' => 'For testing nodes'];
$ch = curl_init("$baseUrl/workflows");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($workflowData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$workflow = json_decode($response, true);
$workflowId = $workflow['id'];
curl_close($ch);

// Test 1: Add Trigger Node
echo "1. Testing Add Trigger Node...\n";
$triggerNode = [
    'node_id' => 'trigger-1',
    'type' => 'trigger',
    'label' => 'Manual Trigger',
    'position_x' => 100,
    'position_y' => 100,
    'config' => ['node_type' => 'manual']
];

$ch = curl_init("$baseUrl/workflows/$workflowId/nodes");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($triggerNode));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Add Trigger Node: SUCCESS\n";
    $triggerNodeResult = json_decode($response, true);
    $triggerNodeId = $triggerNodeResult['id'];
} else {
    echo "❌ Add Trigger Node: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 2: Add Action Node
echo "2. Testing Add Action Node...\n";
$actionNode = [
    'node_id' => 'action-1',
    'type' => 'action',
    'label' => 'HTTP Request',
    'position_x' => 300,
    'position_y' => 100,
    'config' => [
        'node_type' => 'http_request',
        'url' => 'https://httpbin.org/get',
        'method' => 'GET'
    ]
];

$ch = curl_init("$baseUrl/workflows/$workflowId/nodes");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($actionNode));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Add Action Node: SUCCESS\n";
    $actionNodeResult = json_decode($response, true);
    $actionNodeId = $actionNodeResult['id'];
} else {
    echo "❌ Add Action Node: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 3: Connect Nodes
echo "3. Testing Node Connection...\n";
$connection = [
    'source_node_id' => 'trigger-1',
    'target_node_id' => 'action-1',
    'connection_type' => 'success'
];

$ch = curl_init("$baseUrl/workflows/$workflowId/connections");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($connection));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Connect Nodes: SUCCESS\n";
} else {
    echo "❌ Connect Nodes: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 4: Update Node Position
echo "4. Testing Node Position Update...\n";
$positionUpdate = ['position_x' => 150, 'position_y' => 150];

$ch = curl_init("$baseUrl/nodes/$triggerNodeId");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($positionUpdate));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Update Node Position: SUCCESS\n";
} else {
    echo "❌ Update Node Position: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 5: List Nodes
echo "5. Testing List Nodes...\n";
$ch = curl_init("$baseUrl/workflows/$workflowId/nodes");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ List Nodes: SUCCESS\n";
} else {
    echo "❌ List Nodes: FAILED (HTTP $httpCode)\n";
    exit(1);
}

echo "\n🎉 Node Management Test: ALL PASSED\n";