import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Loader2, Mic, Globe } from 'lucide-react';
import api from '@/lib/api';
import { VoiceInput } from './VoiceInput';
import { NLPParser } from '@/lib/nlp-parser';
import { I18nParser } from '@/lib/i18n-parser';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatAIProps {
  onWorkflowGenerated?: (workflow: unknown) => void;
}

export const ChatAI: React.FC<ChatAIProps> = ({ onWorkflowGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [aiProvider, setAiProvider] = useState('openai');

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Try advanced NLP parsing first
      const nlpResult = NLPParser.parseAdvanced(input);
      if (nlpResult.nodes.length > 0) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Generated workflow using advanced NLP parsing with ${nlpResult.nodes.length} nodes.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        onWorkflowGenerated?.({
          name: 'NLP Generated Workflow',
          nodes: nlpResult.nodes,
          connections: nlpResult.connections
        });
        return;
      }

      const response = await api.post('/ai/chat', {
        message: input,
        context: 'workflow_generation',
        language: selectedLanguage,
        provider: aiProvider
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.data.workflow) {
        onWorkflowGenerated?.(response.data.workflow);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: err.response?.data?.message || 'Error processing request. Check API limits.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Workflow Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0">
                    {message.type === 'user' ? (
                      <User className="h-6 w-6 p-1 bg-blue-100 rounded-full" />
                    ) : (
                      <Bot className="h-6 w-6 p-1 bg-green-100 rounded-full" />
                    )}
                  </div>
                  <div
                    className={`p-2 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <Bot className="h-6 w-6 p-1 bg-green-100 rounded-full" />
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-24">
                <Globe className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="es">ES</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="de">DE</SelectItem>
              </SelectContent>
            </Select>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="huggingface">HuggingFace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your workflow..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isLoading}
            />
            <VoiceInput
              onTranscript={(text) => setInput(prev => prev + ' ' + text)}
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};