<?php

echo "=== FlowBuilder Complete Test Suite ===\n";
echo "Running all critical path tests...\n\n";

$testUsers = [
    ['email' => 'test@flowbuilder.com', 'password' => 'password123'],
    ['email' => 'workflow-test@flowbuilder.com', 'password' => 'password123'],
    ['email' => 'node-test@flowbuilder.com', 'password' => 'password123'],
    ['email' => 'execution-test@flowbuilder.com', 'password' => 'password123'],
    ['email' => 'integration-test@flowbuilder.com', 'password' => 'password123'],
    ['email' => 'webhook-test@flowbuilder.com', 'password' => 'password123'],
];

// Create test users first
echo "Setting up test users...\n";
$baseUrl = 'http://127.0.0.1:8000/api';

foreach ($testUsers as $user) {
    $registerData = [
        'name' => 'Test User',
        'email' => $user['email'],
        'password' => $user['password'],
        'password_confirmation' => $user['password']
    ];

    $ch = curl_init("$baseUrl/register");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($registerData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}

echo "✅ Test users created\n\n";

// Run all tests
$tests = [
    'Auth Flow' => 'test-auth-flow.php',
    'Workflow CRUD' => 'test-workflow-crud.php',
    'Node Management' => 'test-node-management.php',
    'Workflow Execution' => 'test-execution.php',
    'Integrations' => 'test-integrations.php',
    'Webhooks' => 'test-webhooks.php',
];

$results = [];
$totalTests = count($tests);
$passedTests = 0;

foreach ($tests as $testName => $testFile) {
    echo "Running $testName Test...\n";
    echo str_repeat('-', 50) . "\n";
    
    $output = [];
    $returnCode = 0;
    exec("php $testFile 2>&1", $output, $returnCode);
    
    if ($returnCode === 0) {
        $results[$testName] = 'PASSED';
        $passedTests++;
        echo "✅ $testName: PASSED\n";
    } else {
        $results[$testName] = 'FAILED';
        echo "❌ $testName: FAILED\n";
        echo "Output:\n" . implode("\n", $output) . "\n";
    }
    
    echo "\n";
}

// Performance benchmarks
echo "=== Performance Benchmarks ===\n";

// Test API response time
$start = microtime(true);
$ch = curl_init("$baseUrl/docs");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_exec($ch);
curl_close($ch);
$responseTime = (microtime(true) - $start) * 1000;

echo "API Response Time: " . round($responseTime, 2) . "ms ";
if ($responseTime < 200) {
    echo "✅ PASSED (< 200ms)\n";
} else {
    echo "❌ FAILED (>= 200ms)\n";
}

// Summary
echo "\n=== Test Summary ===\n";
echo "Total Tests: $totalTests\n";
echo "Passed: $passedTests\n";
echo "Failed: " . ($totalTests - $passedTests) . "\n";
echo "Success Rate: " . round(($passedTests / $totalTests) * 100, 1) . "%\n\n";

foreach ($results as $test => $result) {
    $status = $result === 'PASSED' ? '✅' : '❌';
    echo "$status $test: $result\n";
}

if ($passedTests === $totalTests) {
    echo "\n🎉 ALL TESTS PASSED! FlowBuilder is ready for production!\n";
} else {
    echo "\n⚠️  Some tests failed. Please review and fix issues before deployment.\n";
}

echo "\n=== Next Steps ===\n";
echo "1. Start Laravel server: php artisan serve\n";
echo "2. Start queue worker: php artisan queue:work redis\n";
echo "3. Start scheduler: php artisan schedule:work\n";
echo "4. Access API documentation: http://127.0.0.1:8000/api/docs\n";
echo "5. Deploy to production environment\n";