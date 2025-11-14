<?php

namespace App\Services;

class NodeRegistry
{
    public static function getNodeTypes(): array
    {
        return [
            'trigger' => [
                'manual' => [
                    'name' => 'Manual Trigger',
                    'description' => 'Start workflow manually',
                    'icon' => 'play',
                    'config_schema' => [],
                ],
                'webhook' => [
                    'name' => 'Webhook',
                    'description' => 'Receive HTTP webhooks',
                    'icon' => 'webhook',
                    'config_schema' => [
                        'method' => [
                            'type' => 'select',
                            'label' => 'HTTP Method',
                            'options' => ['GET', 'POST', 'PUT', 'DELETE'],
                            'default' => 'POST',
                        ],
                        'path' => [
                            'type' => 'string',
                            'label' => 'Webhook Path',
                            'placeholder' => '/webhook/path',
                        ],
                    ],
                ],
                'schedule' => [
                    'name' => 'Schedule',
                    'description' => 'Run on a schedule',
                    'icon' => 'clock',
                    'config_schema' => [
                        'cron' => [
                            'type' => 'string',
                            'label' => 'Cron Expression',
                            'placeholder' => '0 */6 * * *',
                            'required' => true,
                        ],
                        'timezone' => [
                            'type' => 'string',
                            'label' => 'Timezone',
                            'default' => 'UTC',
                        ],
                    ],
                ],
            ],
            'action' => [
                'http_request' => [
                    'name' => 'HTTP Request',
                    'description' => 'Make HTTP requests',
                    'icon' => 'globe',
                    'config_schema' => [
                        'url' => [
                            'type' => 'string',
                            'label' => 'URL',
                            'required' => true,
                            'placeholder' => 'https://api.example.com/endpoint',
                        ],
                        'method' => [
                            'type' => 'select',
                            'label' => 'Method',
                            'options' => ['GET', 'POST', 'PUT', 'DELETE'],
                            'default' => 'GET',
                        ],
                        'headers' => [
                            'type' => 'key_value',
                            'label' => 'Headers',
                        ],
                        'body' => [
                            'type' => 'json',
                            'label' => 'Request Body',
                        ],
                    ],
                ],
                'email' => [
                    'name' => 'Send Email',
                    'description' => 'Send email via SMTP',
                    'icon' => 'mail',
                    'config_schema' => [
                        'to' => [
                            'type' => 'string',
                            'label' => 'To',
                            'required' => true,
                            'placeholder' => 'recipient@example.com',
                        ],
                        'subject' => [
                            'type' => 'string',
                            'label' => 'Subject',
                            'required' => true,
                        ],
                        'body' => [
                            'type' => 'text',
                            'label' => 'Message',
                            'required' => true,
                        ],
                    ],
                ],
                'database' => [
                    'name' => 'Database Query',
                    'description' => 'Execute database query',
                    'icon' => 'database',
                    'config_schema' => [
                        'operation' => [
                            'type' => 'select',
                            'label' => 'Operation',
                            'options' => ['select', 'insert', 'update', 'delete', 'raw'],
                            'required' => true,
                        ],
                        'table' => [
                            'type' => 'string',
                            'label' => 'Table',
                            'required' => true,
                        ],
                        'conditions' => [
                            'type' => 'array',
                            'label' => 'Conditions',
                        ],
                    ],
                ],
                'slack' => [
                    'name' => 'Slack Message',
                    'description' => 'Send Slack messages',
                    'icon' => 'message-circle',
                    'config_schema' => [
                        'token' => [
                            'type' => 'string',
                            'label' => 'Bot Token',
                            'required' => true,
                        ],
                        'action' => [
                            'type' => 'select',
                            'label' => 'Action',
                            'options' => ['send_message', 'create_channel'],
                            'default' => 'send_message',
                        ],
                        'channel' => [
                            'type' => 'string',
                            'label' => 'Channel',
                            'required' => true,
                        ],
                        'text' => [
                            'type' => 'text',
                            'label' => 'Message Text',
                        ],
                    ],
                ],
                'google_sheets' => [
                    'name' => 'Google Sheets',
                    'description' => 'Read/write Google Sheets',
                    'icon' => 'sheet',
                    'config_schema' => [
                        'access_token' => [
                            'type' => 'string',
                            'label' => 'Access Token',
                            'required' => true,
                        ],
                        'spreadsheet_id' => [
                            'type' => 'string',
                            'label' => 'Spreadsheet ID',
                            'required' => true,
                        ],
                        'action' => [
                            'type' => 'select',
                            'label' => 'Action',
                            'options' => ['read', 'write', 'append'],
                            'default' => 'read',
                        ],
                        'range' => [
                            'type' => 'string',
                            'label' => 'Range',
                            'default' => 'Sheet1!A1:Z1000',
                        ],
                    ],
                ],
            ],
            'condition' => [
                'if' => [
                    'name' => 'If Condition',
                    'description' => 'Branch based on condition',
                    'icon' => 'git-branch',
                    'config_schema' => [
                        'operator' => [
                            'type' => 'select',
                            'label' => 'Operator',
                            'options' => ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
                            'default' => 'equals',
                        ],
                        'value1' => [
                            'type' => 'string',
                            'label' => 'Left Value',
                            'required' => true,
                            'placeholder' => '{{variable}}',
                        ],
                        'value2' => [
                            'type' => 'string',
                            'label' => 'Right Value',
                            'required' => true,
                        ],
                    ],
                ],
                'filter' => [
                    'name' => 'Filter',
                    'description' => 'Filter data based on rules',
                    'icon' => 'filter',
                    'config_schema' => [
                        'field' => [
                            'type' => 'string',
                            'label' => 'Field Path',
                            'required' => true,
                            'placeholder' => 'data.field',
                        ],
                        'operator' => [
                            'type' => 'select',
                            'label' => 'Operator',
                            'options' => ['exists', 'not_exists', 'equals', 'contains'],
                        ],
                        'value' => [
                            'type' => 'string',
                            'label' => 'Filter Value',
                        ],
                    ],
                ],
            ],
        ];
    }

    public static function getNodeTypeConfig(string $type, string $subtype): ?array
    {
        $types = self::getNodeTypes();
        return $types[$type][$subtype] ?? null;
    }

    public static function validateNodeConfig(string $type, string $subtype, array $config): array
    {
        $nodeType = self::getNodeTypeConfig($type, $subtype);
        if (!$nodeType) {
            return ['error' => 'Invalid node type'];
        }

        $errors = [];
        $schema = $nodeType['config_schema'] ?? [];

        foreach ($schema as $field => $rules) {
            if (($rules['required'] ?? false) && empty($config[$field])) {
                $errors[] = "Field '{$field}' is required";
            }
        }

        return $errors;
    }
}