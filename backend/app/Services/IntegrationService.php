<?php

namespace App\Services;

use App\Models\Integration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

class IntegrationService
{
    public function test(Integration $integration)
    {
        return match($integration->type) {
            'http' => $this->testHttp($integration),
            'email' => $this->testEmail($integration),
            'database' => $this->testDatabase($integration),
            'slack' => $this->testSlack($integration),
            'google_sheets' => $this->testGoogleSheets($integration),
            default => throw new \Exception("Unsupported integration type: {$integration->type}"),
        };
    }

    protected function testHttp(Integration $integration)
    {
        $credentials = $integration->credentials;
        $response = Http::timeout(10)->get($credentials['test_url'] ?? 'https://httpbin.org/get');
        return ['status' => $response->status(), 'success' => $response->successful()];
    }

    protected function testEmail(Integration $integration)
    {
        $credentials = $integration->credentials;
        
        config([
            'mail.mailers.test_smtp' => [
                'transport' => 'smtp',
                'host' => $credentials['host'],
                'port' => $credentials['port'],
                'username' => $credentials['username'],
                'password' => $credentials['password'],
                'encryption' => $credentials['encryption'] ?? 'tls',
            ]
        ]);

        Mail::mailer('test_smtp')->raw('Test email', function ($message) use ($credentials) {
            $message->to($credentials['test_email'] ?? $credentials['username'])
                   ->subject('FlowBuilder Test Email');
        });

        return ['success' => true, 'message' => 'Test email sent'];
    }

    protected function testDatabase(Integration $integration)
    {
        $credentials = $integration->credentials;
        
        $connection = DB::connection()->getPdo();
        $stmt = $connection->prepare('SELECT 1 as test');
        $stmt->execute();
        
        return ['success' => true, 'result' => $stmt->fetch()];
    }

    protected function testSlack(Integration $integration)
    {
        $credentials = $integration->credentials;
        
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $credentials['token'],
        ])->post('https://slack.com/api/chat.postMessage', [
            'channel' => $credentials['test_channel'] ?? '#general',
            'text' => 'FlowBuilder integration test',
        ]);

        return $response->json();
    }

    protected function testGoogleSheets(Integration $integration)
    {
        $credentials = $integration->credentials;
        
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $credentials['access_token'],
        ])->get("https://sheets.googleapis.com/v4/spreadsheets/{$credentials['spreadsheet_id']}/values/A1");

        return $response->json();
    }
}