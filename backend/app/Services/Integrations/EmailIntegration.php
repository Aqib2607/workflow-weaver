<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Mail;
use Illuminate\Mail\Message;
use Exception;

class EmailIntegration
{
    public function execute(array $config, array $data): array
    {
        $to = $this->replaceVariables($config['to'] ?? '', $data);
        $subject = $this->replaceVariables($config['subject'] ?? '', $data);
        $body = $this->replaceVariables($config['body'] ?? '', $data);
        $from = $config['from'] ?? config('mail.from.address');
        $fromName = $config['from_name'] ?? config('mail.from.name');
        
        if (empty($to) || empty($subject)) {
            throw new Exception('Email requires "to" and "subject" fields');
        }
        
        $recipients = $this->parseRecipients($to);
        $cc = !empty($config['cc']) ? $this->parseRecipients($this->replaceVariables($config['cc'], $data)) : [];
        $bcc = !empty($config['bcc']) ? $this->parseRecipients($this->replaceVariables($config['bcc'], $data)) : [];
        
        try {
            Mail::raw($body, function (Message $message) use ($recipients, $cc, $bcc, $subject, $from, $fromName, $config) {
                $message->to($recipients)
                       ->subject($subject)
                       ->from($from, $fromName);
                
                if (!empty($cc)) {
                    $message->cc($cc);
                }
                
                if (!empty($bcc)) {
                    $message->bcc($bcc);
                }
                
                // Handle HTML content
                if (!empty($config['html']) && $config['html']) {
                    $message->html($config['body'] ?? '');
                }
                
                // Handle attachments
                if (!empty($config['attachments'])) {
                    foreach ($config['attachments'] as $attachment) {
                        if (file_exists($attachment)) {
                            $message->attach($attachment);
                        }
                    }
                }
            });
            
            return [
                'sent' => true,
                'to' => $recipients,
                'cc' => $cc,
                'bcc' => $bcc,
                'subject' => $subject,
                'message_id' => uniqid('email_'),
            ];
            
        } catch (Exception $e) {
            throw new Exception("Failed to send email: {$e->getMessage()}");
        }
    }
    
    protected function parseRecipients(string $recipients): array
    {
        return array_map('trim', explode(',', $recipients));
    }
    
    protected function replaceVariables(string $string, array $data): string
    {
        return preg_replace_callback('/\{\{([^}]+)\}\}/', function($matches) use ($data) {
            return data_get($data, $matches[1], '');
        }, $string);
    }
}