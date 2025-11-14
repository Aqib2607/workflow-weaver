<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;
use Exception;

class SlackIntegration
{
    protected string $baseUrl = 'https://slack.com/api';
    
    public function execute(array $config, array $data): array
    {
        $action = $config['action'] ?? 'send_message';
        $token = $config['token'] ?? '';
        
        if (empty($token)) {
            throw new Exception('Slack integration requires a bot token');
        }
        
        switch ($action) {
            case 'send_message':
                return $this->sendMessage($config, $data, $token);
            case 'create_channel':
                return $this->createChannel($config, $data, $token);
            case 'invite_user':
                return $this->inviteUser($config, $data, $token);
            case 'upload_file':
                return $this->uploadFile($config, $data, $token);
            default:
                throw new Exception("Unsupported Slack action: {$action}");
        }
    }
    
    protected function sendMessage(array $config, array $data, string $token): array
    {
        $channel = $this->replaceVariables($config['channel'] ?? '', $data);
        $text = $this->replaceVariables($config['text'] ?? '', $data);
        $username = $config['username'] ?? null;
        $iconEmoji = $config['icon_emoji'] ?? null;
        
        if (empty($channel) || empty($text)) {
            throw new Exception('Slack message requires channel and text');
        }
        
        $payload = [
            'channel' => $channel,
            'text' => $text,
        ];
        
        if ($username) {
            $payload['username'] = $username;
        }
        
        if ($iconEmoji) {
            $payload['icon_emoji'] = $iconEmoji;
        }
        
        // Handle blocks/attachments for rich formatting
        if (!empty($config['blocks'])) {
            $payload['blocks'] = $config['blocks'];
        }
        
        if (!empty($config['attachments'])) {
            $payload['attachments'] = $config['attachments'];
        }
        
        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/chat.postMessage", $payload);
        
        if (!$response->successful()) {
            throw new Exception("Failed to send Slack message: {$response->body()}");
        }
        
        $result = $response->json();
        
        if (!$result['ok']) {
            throw new Exception("Slack API error: {$result['error']}");
        }
        
        return [
            'action' => 'send_message',
            'channel' => $channel,
            'message_ts' => $result['ts'],
            'success' => true,
        ];
    }
    
    protected function createChannel(array $config, array $data, string $token): array
    {
        $name = $this->replaceVariables($config['name'] ?? '', $data);
        $isPrivate = $config['is_private'] ?? false;
        
        if (empty($name)) {
            throw new Exception('Channel creation requires a name');
        }
        
        $endpoint = $isPrivate ? 'groups.create' : 'channels.create';
        
        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/{$endpoint}", [
                'name' => $name,
            ]);
        
        if (!$response->successful()) {
            throw new Exception("Failed to create Slack channel: {$response->body()}");
        }
        
        $result = $response->json();
        
        if (!$result['ok']) {
            throw new Exception("Slack API error: {$result['error']}");
        }
        
        return [
            'action' => 'create_channel',
            'channel_id' => $result['channel']['id'],
            'channel_name' => $result['channel']['name'],
            'success' => true,
        ];
    }
    
    protected function inviteUser(array $config, array $data, string $token): array
    {
        $channel = $this->replaceVariables($config['channel'] ?? '', $data);
        $user = $this->replaceVariables($config['user'] ?? '', $data);
        
        if (empty($channel) || empty($user)) {
            throw new Exception('User invitation requires channel and user');
        }
        
        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/conversations.invite", [
                'channel' => $channel,
                'users' => $user,
            ]);
        
        if (!$response->successful()) {
            throw new Exception("Failed to invite user to Slack channel: {$response->body()}");
        }
        
        $result = $response->json();
        
        if (!$result['ok']) {
            throw new Exception("Slack API error: {$result['error']}");
        }
        
        return [
            'action' => 'invite_user',
            'channel' => $channel,
            'user' => $user,
            'success' => true,
        ];
    }
    
    protected function uploadFile(array $config, array $data, string $token): array
    {
        $filePath = $this->replaceVariables($config['file_path'] ?? '', $data);
        $channels = $this->replaceVariables($config['channels'] ?? '', $data);
        $title = $this->replaceVariables($config['title'] ?? '', $data);
        
        if (empty($filePath) || !file_exists($filePath)) {
            throw new Exception('File upload requires a valid file path');
        }
        
        $response = Http::withToken($token)
            ->attach('file', file_get_contents($filePath), basename($filePath))
            ->post("{$this->baseUrl}/files.upload", [
                'channels' => $channels,
                'title' => $title,
            ]);
        
        if (!$response->successful()) {
            throw new Exception("Failed to upload file to Slack: {$response->body()}");
        }
        
        $result = $response->json();
        
        if (!$result['ok']) {
            throw new Exception("Slack API error: {$result['error']}");
        }
        
        return [
            'action' => 'upload_file',
            'file_id' => $result['file']['id'],
            'file_url' => $result['file']['url_private'],
            'success' => true,
        ];
    }
    
    protected function replaceVariables(string $string, array $data): string
    {
        return preg_replace_callback('/\{\{([^}]+)\}\}/', function($matches) use ($data) {
            return data_get($data, $matches[1], '');
        }, $string);
    }
}