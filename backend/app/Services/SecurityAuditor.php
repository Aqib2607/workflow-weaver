<?php

namespace App\Services;

use App\Models\Workflow;
use App\Models\Integration;
use Illuminate\Support\Facades\Crypt;

class SecurityAuditor
{
    public function auditWorkflow(Workflow $workflow): array
    {
        $issues = [];
        
        // Check for exposed credentials
        $credentialIssues = $this->checkCredentialExposure($workflow);
        $issues = array_merge($issues, $credentialIssues);
        
        // Check for insecure HTTP requests
        $httpIssues = $this->checkInsecureHttpRequests($workflow);
        $issues = array_merge($issues, $httpIssues);
        
        // Check for SQL injection vulnerabilities
        $sqlIssues = $this->checkSqlInjectionRisks($workflow);
        $issues = array_merge($issues, $sqlIssues);
        
        // Check for XSS vulnerabilities
        $xssIssues = $this->checkXssRisks($workflow);
        $issues = array_merge($issues, $xssIssues);
        
        return $issues;
    }
    
    private function checkCredentialExposure(Workflow $workflow): array
    {
        $issues = [];
        $nodes = $workflow->nodes()->get();
        
        foreach ($nodes as $node) {
            $config = $node->config ?? [];
            
            // Check for hardcoded credentials
            if ($this->containsCredentials($config)) {
                $issues[] = [
                    'type' => 'security',
                    'severity' => 'high',
                    'node_id' => $node->node_id,
                    'message' => 'Hardcoded credentials detected',
                    'recommendation' => 'Use integration credentials instead of hardcoded values'
                ];
            }
        }
        
        return $issues;
    }
    
    private function checkInsecureHttpRequests(Workflow $workflow): array
    {
        $issues = [];
        $nodes = $workflow->nodes()->where('type', 'action')->get();
        
        foreach ($nodes as $node) {
            $config = $node->config ?? [];
            
            if (isset($config['url']) && str_starts_with($config['url'], 'http://')) {
                $issues[] = [
                    'type' => 'security',
                    'severity' => 'medium',
                    'node_id' => $node->node_id,
                    'message' => 'Insecure HTTP request detected',
                    'recommendation' => 'Use HTTPS instead of HTTP for secure communication'
                ];
            }
        }
        
        return $issues;
    }
    
    private function checkSqlInjectionRisks(Workflow $workflow): array
    {
        $issues = [];
        $nodes = $workflow->nodes()->get();
        
        foreach ($nodes as $node) {
            $config = $node->config ?? [];
            
            if (isset($config['query']) && $this->hasSqlInjectionRisk($config['query'])) {
                $issues[] = [
                    'type' => 'security',
                    'severity' => 'critical',
                    'node_id' => $node->node_id,
                    'message' => 'Potential SQL injection vulnerability',
                    'recommendation' => 'Use parameterized queries instead of string concatenation'
                ];
            }
        }
        
        return $issues;
    }
    
    private function checkXssRisks(Workflow $workflow): array
    {
        $issues = [];
        $nodes = $workflow->nodes()->get();
        
        foreach ($nodes as $node) {
            $config = $node->config ?? [];
            
            if (isset($config['template']) && $this->hasXssRisk($config['template'])) {
                $issues[] = [
                    'type' => 'security',
                    'severity' => 'high',
                    'node_id' => $node->node_id,
                    'message' => 'Potential XSS vulnerability in template',
                    'recommendation' => 'Sanitize user input and escape output'
                ];
            }
        }
        
        return $issues;
    }
    
    private function containsCredentials($config): bool
    {
        $sensitiveKeys = ['password', 'api_key', 'secret', 'token', 'key'];
        
        foreach ($sensitiveKeys as $key) {
            if (isset($config[$key]) && !empty($config[$key])) {
                // Check if it's a reference to integration ({{integration.key}})
                if (!preg_match('/\{\{integration\..+\}\}/', $config[$key])) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private function hasSqlInjectionRisk($query): bool
    {
        // Simple check for string concatenation patterns
        $patterns = [
            '/\+\s*["\']/',  // String concatenation
            '/\$\w+/',       // Variable interpolation
            '/\{\{\w+\}\}/'  // Template variables without sanitization
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $query)) {
                return true;
            }
        }
        
        return false;
    }
    
    private function hasXssRisk($template): bool
    {
        // Check for unescaped template variables
        return preg_match('/\{\{\{.+\}\}\}/', $template) || 
               preg_match('/<script|javascript:|on\w+=/i', $template);
    }
}