<?php

require_once 'vendor/autoload.php';

echo "=== Workflow Execution Test ===\n";

$baseUrl = 'http://127.0.0.1:8000/api';
$testEmail = 'execution-test@flowbuilder.com';
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

// Create test workflow with nodes
$workflowData = ['name' => 'Execution Test Workflow', 'is_active' => true];
$ch = curl_init("$baseUrl/workflows");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($workflowData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$workflow = json_decode($response, true);
$workflowId = $workflow['id'];
curl_close($ch);

// Add trigger node
$triggerNode = [
    'node_id' => 'trigger-exec',
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
curl_exec($ch);
curl_close($ch);

// Add action node
$actionNode = [
    'node_id' => 'action-exec',
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
curl_exec($ch);
curl_close($ch);

// Connect nodes
$connection = [
    'source_node_id' => 'trigger-exec',
    'target_node_id' => 'action-exec',
    'connection_type' => 'success'
];

$ch = curl_init("$baseUrl/workflows/$workflowId/connections");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($connection));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_exec($ch);
curl_close($ch);

// Test 1: Execute Workflow
echo "1. Testing Workflow Execution...\n";
$executionData = ['trigger_data' => ['test' => true]];

$ch = curl_init("$baseUrl/workflows/$workflowId/execute");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($executionData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 202) {
    echo "✅ Trigger Workflow Execution: SUCCESS\n";
} else {
    echo "❌ Trigger Workflow Execution: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Wait a moment for execution
sleep(2);

// Test 2: Check Execution History
echo "2. Testing Execution History...\n";
$ch = curl_init("$baseUrl/workflows/$workflowId/executions");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Get Execution History: SUCCESS\n";
    $executions = json_decode($response, true);
    if (!empty($executions['data'])) {
        $executionId = $executions['data'][0]['id'];
        
        // Test 3: Get Execution Logs
        echo "3. Testing Execution Logs...\n";
        $ch = curl_init("$baseUrl/executions/$executionId/logs");
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            echo "✅ Get Execution Logs: SUCCESS\n";
        } else {
            echo "❌ Get Execution Logs: FAILED (HTTP $httpCode)\n";
        }
    }
} else {
    echo "❌ Get Execution History: FAILED (HTTP $httpCode)\n";
    exit(1);
}

echo "\n🎉 Workflow Execution Test: ALL PASSED\n";