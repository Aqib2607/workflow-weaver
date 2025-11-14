<?php

namespace App\Services;

use Exception;

class DataTransformationService
{
    public function transform(array $data, array $transformations): array
    {
        $result = $data;
        
        foreach ($transformations as $transformation) {
            $result = $this->applyTransformation($result, $transformation);
        }
        
        return $result;
    }
    
    protected function applyTransformation(array $data, array $transformation): array
    {
        $type = $transformation['type'] ?? '';
        
        switch ($type) {
            case 'map':
                return $this->mapData($data, $transformation);
            case 'filter':
                return $this->filterData($data, $transformation);
            case 'sort':
                return $this->sortData($data, $transformation);
            case 'group':
                return $this->groupData($data, $transformation);
            case 'extract':
                return $this->extractData($data, $transformation);
            default:
                return $data;
        }
    }
    
    protected function mapData(array $data, array $config): array
    {
        $mapping = $config['mapping'] ?? [];
        $result = [];
        
        foreach ($data as $item) {
            $mappedItem = [];
            foreach ($mapping as $targetKey => $sourcePath) {
                $mappedItem[$targetKey] = data_get($item, $sourcePath);
            }
            $result[] = $mappedItem;
        }
        
        return $result;
    }
    
    protected function filterData(array $data, array $config): array
    {
        $conditions = $config['conditions'] ?? [];
        
        return array_filter($data, function($item) use ($conditions) {
            foreach ($conditions as $condition) {
                $field = $condition['field'] ?? '';
                $operator = $condition['operator'] ?? '=';
                $value = $condition['value'] ?? '';
                
                $itemValue = data_get($item, $field);
                
                if (!$this->evaluateCondition($itemValue, $operator, $value)) {
                    return false;
                }
            }
            return true;
        });
    }
    
    protected function sortData(array $data, array $config): array
    {
        $field = $config['field'] ?? '';
        $direction = $config['direction'] ?? 'asc';
        
        usort($data, function($a, $b) use ($field, $direction) {
            $valueA = data_get($a, $field);
            $valueB = data_get($b, $field);
            
            $comparison = $valueA <=> $valueB;
            
            return $direction === 'desc' ? -$comparison : $comparison;
        });
        
        return $data;
    }
    
    protected function groupData(array $data, array $config): array
    {
        $field = $config['field'] ?? '';
        $result = [];
        
        foreach ($data as $item) {
            $groupKey = data_get($item, $field);
            if (!isset($result[$groupKey])) {
                $result[$groupKey] = [];
            }
            $result[$groupKey][] = $item;
        }
        
        return $result;
    }
    
    protected function extractData(array $data, array $config): array
    {
        $path = $config['path'] ?? '';
        
        if (empty($path)) {
            return $data;
        }
        
        return data_get($data, $path, []);
    }
    
    protected function evaluateCondition($value, string $operator, $expected): bool
    {
        switch ($operator) {
            case '=':
            case 'equals':
                return $value == $expected;
            case '!=':
            case 'not_equals':
                return $value != $expected;
            case '>':
            case 'greater_than':
                return $value > $expected;
            case '<':
            case 'less_than':
                return $value < $expected;
            case '>=':
                return $value >= $expected;
            case '<=':
                return $value <= $expected;
            case 'contains':
                return str_contains((string)$value, (string)$expected);
            case 'starts_with':
                return str_starts_with((string)$value, (string)$expected);
            case 'ends_with':
                return str_ends_with((string)$value, (string)$expected);
            default:
                return false;
        }
    }
}