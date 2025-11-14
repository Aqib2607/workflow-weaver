<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class HttpRequestIntegration
{
    public function execute(array $config, array $data): array
    {
        $url = $this->replaceVariables($config['url'] ?? '', $data);
        $method = strtolower($config['method'] ?? 'get');
        $timeout = $config['timeout'] ?? 30;
        
        $request = Http::timeout($timeout);
        
        // Add authentication
        if (!empty($config['auth'])) {
            $request = $this->addAuthentication($request, $config['auth'], $data);
        }
        
        // Add headers
        if (!empty($config['headers'])) {
            foreach ($config['headers'] as $key => $value) {
                $request->withHeader($key, $this->replaceVariables($value, $data));
            }
        }
        
        // Prepare body
        $body = $this->prepareBody($config, $data);
        
        $response = match($method) {
            'get' => $request->get($url, $config['query'] ?? []),
            'post' => $request->post($url, $body),
            'put' => $request->put($url, $body),
            'patch' => $request->patch($url, $body),
            'delete' => $request->delete($url, $body),
            default => throw new Exception("Unsupported HTTP method: {$method}"),
        };
        
        return [
            'status_code' => $response->status(),
            'headers' => $response->headers(),
            'body' => $response->json() ?? $response->body(),
            'success' => $response->successful(),
        ];
    }
    
    protected function addAuthentication($request, array $auth, array $data)
    {
        $type = $auth['type'] ?? 'none';
        
        switch ($type) {
            case 'bearer':
                $token = $this->replaceVariables($auth['token'] ?? '', $data);
                return $request->withToken($token);
                
            case 'basic':
                $username = $this->replaceVariables($auth['username'] ?? '', $data);
                $password = $this->replaceVariables($auth['password'] ?? '', $data);
                return $request->withBasicAuth($username, $password);
                
            case 'api_key':
                $key = $this->replaceVariables($auth['key'] ?? '', $data);
                $value = $this->replaceVariables($auth['value'] ?? '', $data);
                return $request->withHeader($key, $value);
                
            default:
                return $request;
        }
    }
    
    protected function prepareBody(array $config, array $data): mixed
    {
        if (empty($config['body'])) {
            return [];
        }
        
        $body = $config['body'];
        
        if (is_string($body)) {
            $body = $this->replaceVariables($body, $data);
            return json_decode($body, true) ?? $body;
        }
        
        return $body;
    }
    
    protected function replaceVariables(string $string, array $data): string
    {
        return preg_replace_callback('/\{\{([^}]+)\}\}/', function($matches) use ($data) {
            return data_get($data, $matches[1], '');
        }, $string);
    }
}