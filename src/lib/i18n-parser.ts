export class I18nParser {
  private static readonly LANGUAGE_PATTERNS = {
    en: {
      triggers: {
        webhook: /webhook|receive|incoming|api/i,
        schedule: /every|daily|weekly|schedule/i,
        manual: /manual|button|start/i
      },
      actions: {
        email: /send email|email|notify/i,
        http: /http|api|request|call/i,
        database: /database|save|store/i
      }
    },
    es: {
      triggers: {
        webhook: /webhook|recibir|entrante|api/i,
        schedule: /cada|diario|semanal|programar/i,
        manual: /manual|botón|iniciar/i
      },
      actions: {
        email: /enviar correo|email|notificar/i,
        http: /http|api|solicitud|llamar/i,
        database: /base de datos|guardar|almacenar/i
      }
    },
    fr: {
      triggers: {
        webhook: /webhook|recevoir|entrant|api/i,
        schedule: /chaque|quotidien|hebdomadaire|programmer/i,
        manual: /manuel|bouton|démarrer/i
      },
      actions: {
        email: /envoyer email|email|notifier/i,
        http: /http|api|requête|appeler/i,
        database: /base de données|sauvegarder|stocker/i
      }
    },
    de: {
      triggers: {
        webhook: /webhook|empfangen|eingehend|api/i,
        schedule: /jeden|täglich|wöchentlich|planen/i,
        manual: /manuell|taste|starten/i
      },
      actions: {
        email: /email senden|email|benachrichtigen/i,
        http: /http|api|anfrage|aufrufen/i,
        database: /datenbank|speichern|lagern/i
      }
    }
  };

  static detectLanguage(text: string): string {
    const commonWords = {
      en: ['the', 'and', 'or', 'when', 'if', 'then', 'send', 'create'],
      es: ['el', 'la', 'y', 'o', 'cuando', 'si', 'entonces', 'enviar', 'crear'],
      fr: ['le', 'la', 'et', 'ou', 'quand', 'si', 'alors', 'envoyer', 'créer'],
      de: ['der', 'die', 'und', 'oder', 'wenn', 'dann', 'senden', 'erstellen']
    };

    const words = text.toLowerCase().split(/\s+/);
    const scores: Record<string, number> = {};

    for (const [lang, langWords] of Object.entries(commonWords)) {
      scores[lang] = 0;
      for (const word of words) {
        if (langWords.includes(word)) {
          scores[lang]++;
        }
      }
    }

    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  }

  static parseMultiLanguage(text: string, language?: string): { nodes: unknown[], connections: unknown[] } {
    const detectedLang = language || this.detectLanguage(text);
    const patterns = this.LANGUAGE_PATTERNS[detectedLang as keyof typeof this.LANGUAGE_PATTERNS] || this.LANGUAGE_PATTERNS.en;

    // Use the detected language patterns for parsing
    return this.parseWithPatterns(text, patterns);
  }

  private static parseWithPatterns(text: string, patterns: typeof this.LANGUAGE_PATTERNS.en): { nodes: unknown[], connections: unknown[] } {
    const nodes = [];
    const connections = [];
    let nodeId = 1;

    // Check for triggers
    for (const [type, pattern] of Object.entries(patterns.triggers)) {
      if (pattern instanceof RegExp && pattern.test(text)) {
        nodes.push({
          id: `node-${nodeId++}`,
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: { label: this.getLocalizedLabel('trigger', type), config: { subtype: type } }
        });
        break;
      }
    }

    // Check for actions
    for (const [type, pattern] of Object.entries(patterns.actions)) {
      if (pattern instanceof RegExp && pattern.test(text)) {
        nodes.push({
          id: `node-${nodeId++}`,
          type: 'action',
          position: { x: 300, y: 100 },
          data: { label: this.getLocalizedLabel('action', type), config: { subtype: type } }
        });
      }
    }

    // Create connections
    if (nodes.length > 1) {
      for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({
          id: `conn-${i}`,
          from: nodes[i].id,
          to: nodes[i + 1].id
        });
      }
    }

    return { nodes, connections };
  }

  private static getLocalizedLabel(nodeType: string, subtype: string): string {
    const labels = {
      trigger: {
        webhook: 'Webhook Trigger',
        schedule: 'Schedule Trigger',
        manual: 'Manual Trigger'
      },
      action: {
        email: 'Send Email',
        http: 'HTTP Request',
        database: 'Database Action'
      }
    };

    const nodeLabels = labels[nodeType as keyof typeof labels];
    return nodeLabels?.[subtype as keyof typeof nodeLabels] || `${nodeType} ${subtype}`;
  }

  static getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' }
    ];
  }
}