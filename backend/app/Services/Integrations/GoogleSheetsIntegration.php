<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;
use Exception;

class GoogleSheetsIntegration
{
    protected string $baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    public function execute(array $config, array $data): array
    {
        $action = $config['action'] ?? 'read';
        $accessToken = $config['access_token'] ?? '';
        $spreadsheetId = $config['spreadsheet_id'] ?? '';
        
        if (empty($accessToken) || empty($spreadsheetId)) {
            throw new Exception('Google Sheets integration requires access_token and spreadsheet_id');
        }
        
        switch ($action) {
            case 'read':
                return $this->readSheet($config, $data, $accessToken, $spreadsheetId);
            case 'write':
                return $this->writeSheet($config, $data, $accessToken, $spreadsheetId);
            case 'append':
                return $this->appendSheet($config, $data, $accessToken, $spreadsheetId);
            case 'clear':
                return $this->clearSheet($config, $data, $accessToken, $spreadsheetId);
            default:
                throw new Exception("Unsupported Google Sheets action: {$action}");
        }
    }
    
    protected function readSheet(array $config, array $data, string $accessToken, string $spreadsheetId): array
    {
        $range = $config['range'] ?? 'Sheet1!A1:Z1000';
        $valueRenderOption = $config['value_render_option'] ?? 'FORMATTED_VALUE';
        
        $response = Http::withToken($accessToken)
            ->get("{$this->baseUrl}/{$spreadsheetId}/values/{$range}", [
                'valueRenderOption' => $valueRenderOption,
            ]);
        
        if (!$response->successful()) {
            throw new Exception("Failed to read Google Sheet: {$response->body()}");
        }
        
        $result = $response->json();
        $values = $result['values'] ?? [];
        
        // Convert to associative array if headers are present
        $formattedData = [];
        if (!empty($values)) {
            $headers = array_shift($values);
            foreach ($values as $row) {
                $rowData = [];
                foreach ($headers as $index => $header) {
                    $rowData[$header] = $row[$index] ?? '';
                }
                $formattedData[] = $rowData;
            }
        }
        
        return [
            'action' => 'read',
            'range' => $range,
            'row_count' => count($values),
            'data' => $formattedData,
            'raw_values' => $values,
        ];
    }
    
    protected function writeSheet(array $config, array $data, string $accessToken, string $spreadsheetId): array
    {
        $range = $config['range'] ?? 'Sheet1!A1';
        $values = $config['values'] ?? [];
        $valueInputOption = $config['value_input_option'] ?? 'RAW';
        
        // Replace variables in values
        $processedValues = $this->processValues($values, $data);
        
        $response = Http::withToken($accessToken)
            ->put("{$this->baseUrl}/{$spreadsheetId}/values/{$range}", [
                'values' => $processedValues,
                'valueInputOption' => $valueInputOption,
            ]);
        
        if (!$response->successful()) {
            throw new Exception("Failed to write to Google Sheet: {$response->body()}");
        }
        
        $result = $response->json();
        
        return [
            'action' => 'write',
            'range' => $range,
            'updated_rows' => $result['updatedRows'] ?? 0,
            'updated_columns' => $result['updatedColumns'] ?? 0,
            'updated_cells' => $result['updatedCells'] ?? 0,
        ];
    }
    
    protected function appendSheet(array $config, array $data, string $accessToken, string $spreadsheetId): array
    {
        $range = $config['range'] ?? 'Sheet1!A1';
        $values = $config['values'] ?? [];
        $valueInputOption = $config['value_input_option'] ?? 'RAW';
        $insertDataOption = $config['insert_data_option'] ?? 'INSERT_ROWS';
        
        // Replace variables in values
        $processedValues = $this->processValues($values, $data);
        
        $response = Http::withToken($accessToken)
            ->post("{$this->baseUrl}/{$spreadsheetId}/values/{$range}:append", [
                'values' => $processedValues,
                'valueInputOption' => $valueInputOption,
                'insertDataOption' => $insertDataOption,
            ]);
        
        if (!$response->successful()) {
            throw new Exception("Failed to append to Google Sheet: {$response->body()}");
        }
        
        $result = $response->json();
        
        return [
            'action' => 'append',
            'range' => $range,
            'updated_rows' => $result['updates']['updatedRows'] ?? 0,
            'updated_columns' => $result['updates']['updatedColumns'] ?? 0,
            'updated_cells' => $result['updates']['updatedCells'] ?? 0,
        ];
    }
    
    protected function clearSheet(array $config, array $data, string $accessToken, string $spreadsheetId): array
    {
        $range = $config['range'] ?? 'Sheet1!A1:Z1000';
        
        $response = Http::withToken($accessToken)
            ->post("{$this->baseUrl}/{$spreadsheetId}/values/{$range}:clear");
        
        if (!$response->successful()) {
            throw new Exception("Failed to clear Google Sheet: {$response->body()}");
        }
        
        $result = $response->json();
        
        return [
            'action' => 'clear',
            'range' => $range,
            'cleared_range' => $result['clearedRange'] ?? $range,
        ];
    }
    
    protected function processValues(array $values, array $data): array
    {
        $processed = [];
        foreach ($values as $row) {
            $processedRow = [];
            foreach ($row as $cell) {
                if (is_string($cell)) {
                    $processedRow[] = $this->replaceVariables($cell, $data);
                } else {
                    $processedRow[] = $cell;
                }
            }
            $processed[] = $processedRow;
        }
        return $processed;
    }
    
    protected function replaceVariables(string $string, array $data): string
    {
        return preg_replace_callback('/\{\{([^}]+)\}\}/', function($matches) use ($data) {
            return data_get($data, $matches[1], '');
        }, $string);
    }
}