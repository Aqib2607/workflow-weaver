import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Download, Filter } from 'lucide-react';
import { useWorkflows } from '@/hooks/useWorkflows';

interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  author: string;
  preview_image?: string;
  is_premium: boolean;
  price?: number;
}

export const WorkflowMarketplace: React.FC = () => {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const { loadWorkflows } = useWorkflows();

  const categories = [
    'all',
    'automation',
    'data-processing',
    'notifications',
    'integrations',
    'analytics',
    'marketing',
    'productivity'
  ];

  useEffect(() => {
    const sampleTemplates: MarketplaceTemplate[] = [
      {
        id: '1',
        name: 'Email Marketing Automation',
        description: 'Automated email campaigns with user segmentation and analytics',
        category: 'marketing',
        tags: ['email', 'marketing', 'automation'],
        rating: 4.8,
        downloads: 1250,
        author: 'FlowBuilder Team',
        is_premium: false
      },
      {
        id: '2',
        name: 'Data Backup & Sync',
        description: 'Automated data backup to multiple cloud providers with verification',
        category: 'data-processing',
        tags: ['backup', 'cloud', 'sync'],
        rating: 4.6,
        downloads: 890,
        author: 'CloudSync Pro',
        is_premium: true,
        price: 29.99
      },
      {
        id: '3',
        name: 'Slack Notification Hub',
        description: 'Centralized notification system for team communication',
        category: 'notifications',
        tags: ['slack', 'notifications', 'team'],
        rating: 4.9,
        downloads: 2100,
        author: 'TeamFlow',
        is_premium: false
      },
      {
        id: '4',
        name: 'E-commerce Order Processing',
        description: 'Complete order processing workflow with inventory management',
        category: 'automation',
        tags: ['ecommerce', 'orders', 'inventory'],
        rating: 4.7,
        downloads: 756,
        author: 'RetailFlow',
        is_premium: true,
        price: 49.99
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setTemplates(sampleTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template: MarketplaceTemplate) => {
    try {
      // TODO: Implement template creation API call
      console.log('Creating workflow from template:', template.id);
      // Show success message
    } catch (error) {
      console.error('Failed to create workflow from template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Filter by category"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    by {template.author}
                  </CardDescription>
                </div>
                {template.is_premium && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Premium
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">{template.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm ml-1">{template.rating}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Download className="h-4 w-4" />
                    <span className="text-sm ml-1">{template.downloads}</span>
                  </div>
                </div>
                
                {template.is_premium && template.price && (
                  <span className="text-lg font-semibold text-green-600">
                    ${template.price}
                  </span>
                )}
              </div>
              
              <Button 
                onClick={() => handleUseTemplate(template)}
                className="w-full"
                variant={template.is_premium ? "default" : "outline"}
              >
                {template.is_premium ? 'Purchase & Use' : 'Use Template'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No templates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};