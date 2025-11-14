<?php

require_once 'vendor/autoload.php';

echo "=== Auth Flow Test ===\n";

$baseUrl = 'http://127.0.0.1:8000/api';
$testEmail = 'test@flowbuilder.com';
$testPassword = 'password123';

// Test 1: Register
echo "1. Testing Registration...\n";
$registerData = [
    'name' => 'Test User',
    'email' => $testEmail,
    'password' => $testPassword,
    'password_confirmation' => $testPassword
];

$ch = curl_init("$baseUrl/register");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($registerData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    echo "✅ Registration: SUCCESS\n";
    $registerResult = json_decode($response, true);
    $token = $registerResult['token'];
} else {
    echo "❌ Registration: FAILED (HTTP $httpCode)\n";
    echo "Response: $response\n";
    exit(1);
}

// Test 2: Login
echo "2. Testing Login...\n";
$loginData = [
    'email' => $testEmail,
    'password' => $testPassword
];

$ch = curl_init("$baseUrl/login");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Login: SUCCESS\n";
    $loginResult = json_decode($response, true);
    $token = $loginResult['token'];
} else {
    echo "❌ Login: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 3: Access Protected Route
echo "3. Testing Protected Route Access...\n";
$ch = curl_init("$baseUrl/user");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Protected Route Access: SUCCESS\n";
} else {
    echo "❌ Protected Route Access: FAILED (HTTP $httpCode)\n";
    exit(1);
}

// Test 4: Logout
echo "4. Testing Logout...\n";
$ch = curl_init("$baseUrl/logout");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Logout: SUCCESS\n";
} else {
    echo "❌ Logout: FAILED (HTTP $httpCode)\n";
    exit(1);
}

echo "\n🎉 Auth Flow Test: ALL PASSED\n";