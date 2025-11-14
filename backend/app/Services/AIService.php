<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    protected $apiKey;
    protected $model;
    protected $provider;
    protected $claudeKey;
    protected $geminiKey;

    public function __construct()
    {
        $this->provider = config('services.ai.provider', 'openai');
        $this->apiKey = config('services.ai.api_key');
        $this->claudeKey = config('services.ai.claude_key');
        $this->geminiKey = config('services.ai.gemini_key');
        $this->model = config('services.ai.model', 'gpt-3.5-turbo');
    }

    public function generateWorkflowFromPrompt(string $prompt, string $context = 'workflow_generation'): array
    {
        if (!$this->apiKey) {
            throw new \Exception('AI API key not configured');
        }

        $systemPrompt = $this->getSystemPrompt();
        
        try {
            switch ($this->provider) {
                case 'openai':
                    return $this->callOpenAI($systemPrompt, $prompt);
                case 'huggingface':
                    return $this->callHuggingFace($prompt);
                case 'claude':
                    return $this->callClaude($systemPrompt, $prompt);
                case 'gemini':
                    return $this->callGemini($systemPrompt, $prompt);
                default:
                    throw new \Exception('Unsupported AI provider: ' . $this->provider);
            }
        } catch (\Exception $e) {
            Log::error('AI Service Error: ' . $e->getMessage());
            throw $e;
        }
    }

    protected function callOpenAI(string $systemPrompt, string $userPrompt): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt]
            ],
            'max_tokens' => config('services.ai.max_tokens', 1000),
            'temperature' => config('services.ai.temperature', 0.7),
        ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API error: ' . $response->body());
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? '';

        return $this->parseAIResponse($content);
    }

    protected function callHuggingFace(string $prompt): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->timeout(30)->post('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', [
            'inputs' => $prompt,
            'parameters' => [
                'max_length' => 500,
                'temperature' => 0.7,
            ]
        ]);

        if (!$response->successful()) {
            throw new \Exception('HuggingFace API error: ' . $response->body());
        }

        $data = $response->json();
        $content = $data[0]['generated_text'] ?? $prompt;

        return $this->parseAIResponse($content);
    }

    protected function callClaude(string $systemPrompt, string $userPrompt): array
    {
        if (!$this->claudeKey) {
            throw new \Exception('Claude API key not configured');
        }

        $response = Http::withHeaders([
            'x-api-key' => $this->claudeKey,
            'Content-Type' => 'application/json',
            'anthropic-version' => '2023-06-01'
        ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
            'model' => 'claude-3-haiku-20240307',
            'max_tokens' => config('services.ai.max_tokens', 1000),
            'system' => $systemPrompt,
            'messages' => [
                ['role' => 'user', 'content' => $userPrompt]
            ]
        ]);

        if (!$response->successful()) {
            throw new \Exception('Claude API error: ' . $response->body());
        }

        $data = $response->json();
        $content = $data['content'][0]['text'] ?? '';

        return $this->parseAIResponse($content);
    }

    protected function callGemini(string $systemPrompt, string $userPrompt): array
    {
        if (!$this->geminiKey) {
            throw new \Exception('Gemini API key not configured');
        }

        $response = Http::timeout(30)->post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' . $this->geminiKey,
            [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemPrompt . '\n\n' . $userPrompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'maxOutputTokens' => config('services.ai.max_tokens', 1000),
                    'temperature' => config('services.ai.temperature', 0.7)
                ]
            ]
        );

        if (!$response->successful()) {
            throw new \Exception('Gemini API error: ' . $response->body());
        }

        $data = $response->json();
        $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

        return $this->parseAIResponse($content);
    }

    protected function parseAIResponse(string $content): array
    {
        // Try to extract JSON workflow from response
        if (preg_match('/\{.*\}/s', $content, $matches)) {
            try {
                $workflow = json_decode($matches[0], true);
                if ($workflow && isset($workflow['nodes'])) {
                    return [
                        'message' => 'Workflow generated successfully!',
                        'workflow' => $workflow
                    ];
                }
            } catch (\Exception $e) {
                // Fall through to text response
            }
        }

        return [
            'message' => $content,
            'workflow' => null
        ];
    }

    protected function getSystemPrompt(): string
    {
        return "You are a workflow automation assistant. When users describe a task, generate a JSON workflow with nodes and connections. 

Format:
{
  \"name\": \"Workflow Name\",
  \"nodes\": [
    {\"id\": \"1\", \"type\": \"trigger\", \"label\": \"Start\", \"x\": 100, \"y\": 100, \"config\": {}},
    {\"id\": \"2\", \"type\": \"action\", \"label\": \"Action\", \"x\": 300, \"y\": 100, \"config\": {}}
  ],
  \"connections\": [
    {\"source\": \"1\", \"target\": \"2\"}
  ]
}

Node types: trigger (webhook, schedule, manual), action (http_request, email, database), condition (if, filter).
Keep responses concise and always include valid JSON when possible.";
    }
}