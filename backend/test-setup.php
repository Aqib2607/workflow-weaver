<?php

// Simple test script to verify Laravel setup
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

echo "=== FlowBuilder Backend Setup Test ===\n";
echo "Laravel Version: " . app()->version() . "\n";

// Test database connection
try {
    $pdo = new PDO(
        'mysql:host=' . env('DB_HOST') . ';port=' . env('DB_PORT') . ';dbname=' . env('DB_DATABASE'),
        env('DB_USERNAME'),
        env('DB_PASSWORD')
    );
    echo "✅ Database connection: SUCCESS\n";
} catch (Exception $e) {
    echo "❌ Database connection: FAILED - " . $e->getMessage() . "\n";
}

// Test models exist
$models = ['User', 'Workflow', 'WorkflowNode', 'NodeConnection', 'WorkflowExecution', 'ExecutionLog'];
foreach ($models as $model) {
    $class = "App\\Models\\$model";
    if (class_exists($class)) {
        echo "✅ Model $model: EXISTS\n";
    } else {
        echo "❌ Model $model: MISSING\n";
    }
}

// Test controllers exist
$controllers = ['AuthController', 'WorkflowController', 'NodeController'];
foreach ($controllers as $controller) {
    $class = "App\\Http\\Controllers\\API\\$controller";
    if (class_exists($class)) {
        echo "✅ Controller $controller: EXISTS\n";
    } else {
        echo "❌ Controller $controller: MISSING\n";
    }
}

echo "\n=== Setup Complete ===\n";
echo "Next steps:\n";
echo "1. Run: php artisan migrate\n";
echo "2. Test API endpoints with Postman\n";
echo "3. Start development server: php artisan serve\n";