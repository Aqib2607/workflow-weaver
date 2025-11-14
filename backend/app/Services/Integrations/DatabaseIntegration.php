<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\DB;
use Exception;

class DatabaseIntegration
{
    public function execute(array $config, array $data): array
    {
        $operation = $config['operation'] ?? 'select';
        $table = $config['table'] ?? '';
        $connection = $config['connection'] ?? 'default';
        
        if (empty($table)) {
            throw new Exception('Database operation requires a table name');
        }
        
        try {
            switch ($operation) {
                case 'select':
                    return $this->executeSelect($config, $data, $connection);
                case 'insert':
                    return $this->executeInsert($config, $data, $connection);
                case 'update':
                    return $this->executeUpdate($config, $data, $connection);
                case 'delete':
                    return $this->executeDelete($config, $data, $connection);
                case 'raw':
                    return $this->executeRaw($config, $data, $connection);
                default:
                    throw new Exception("Unsupported database operation: {$operation}");
            }
        } catch (Exception $e) {
            throw new Exception("Database operation failed: {$e->getMessage()}");
        }
    }
    
    protected function executeSelect(array $config, array $data, string $connection): array
    {
        $query = DB::connection($connection)->table($config['table']);
        
        // Apply conditions
        if (!empty($config['conditions'])) {
            foreach ($config['conditions'] as $condition) {
                $field = $condition['field'] ?? '';
                $operator = $condition['operator'] ?? '=';
                $value = $this->replaceVariables($condition['value'] ?? '', $data);
                
                if ($field) {
                    $query->where($field, $operator, $value);
                }
            }
        }
        
        // Apply ordering
        if (!empty($config['order_by'])) {
            $query->orderBy($config['order_by'], $config['order_direction'] ?? 'asc');
        }
        
        // Apply limit
        if (!empty($config['limit'])) {
            $query->limit($config['limit']);
        }
        
        $results = $query->get()->toArray();
        
        return [
            'operation' => 'select',
            'table' => $config['table'],
            'count' => count($results),
            'data' => $results,
        ];
    }
    
    protected function executeInsert(array $config, array $data, string $connection): array
    {
        $insertData = $config['data'] ?? [];
        
        // Replace variables in insert data
        foreach ($insertData as $key => $value) {
            if (is_string($value)) {
                $insertData[$key] = $this->replaceVariables($value, $data);
            }
        }
        
        $id = DB::connection($connection)->table($config['table'])->insertGetId($insertData);
        
        return [
            'operation' => 'insert',
            'table' => $config['table'],
            'inserted_id' => $id,
            'data' => $insertData,
        ];
    }
    
    protected function executeUpdate(array $config, array $data, string $connection): array
    {
        $query = DB::connection($connection)->table($config['table']);
        
        // Apply conditions
        if (!empty($config['conditions'])) {
            foreach ($config['conditions'] as $condition) {
                $field = $condition['field'] ?? '';
                $operator = $condition['operator'] ?? '=';
                $value = $this->replaceVariables($condition['value'] ?? '', $data);
                
                if ($field) {
                    $query->where($field, $operator, $value);
                }
            }
        }
        
        $updateData = $config['data'] ?? [];
        
        // Replace variables in update data
        foreach ($updateData as $key => $value) {
            if (is_string($value)) {
                $updateData[$key] = $this->replaceVariables($value, $data);
            }
        }
        
        $affected = $query->update($updateData);
        
        return [
            'operation' => 'update',
            'table' => $config['table'],
            'affected_rows' => $affected,
            'data' => $updateData,
        ];
    }
    
    protected function executeDelete(array $config, array $data, string $connection): array
    {
        $query = DB::connection($connection)->table($config['table']);
        
        // Apply conditions
        if (!empty($config['conditions'])) {
            foreach ($config['conditions'] as $condition) {
                $field = $condition['field'] ?? '';
                $operator = $condition['operator'] ?? '=';
                $value = $this->replaceVariables($condition['value'] ?? '', $data);
                
                if ($field) {
                    $query->where($field, $operator, $value);
                }
            }
        }
        
        $deleted = $query->delete();
        
        return [
            'operation' => 'delete',
            'table' => $config['table'],
            'deleted_rows' => $deleted,
        ];
    }
    
    protected function executeRaw(array $config, array $data, string $connection): array
    {
        $sql = $this->replaceVariables($config['sql'] ?? '', $data);
        $bindings = $config['bindings'] ?? [];
        
        // Replace variables in bindings
        foreach ($bindings as $key => $value) {
            if (is_string($value)) {
                $bindings[$key] = $this->replaceVariables($value, $data);
            }
        }
        
        $results = DB::connection($connection)->select($sql, $bindings);
        
        return [
            'operation' => 'raw',
            'sql' => $sql,
            'count' => count($results),
            'data' => $results,
        ];
    }
    
    protected function replaceVariables(string $string, array $data): string
    {
        return preg_replace_callback('/\{\{([^}]+)\}\}/', function($matches) use ($data) {
            return data_get($data, $matches[1], '');
        }, $string);
    }
}