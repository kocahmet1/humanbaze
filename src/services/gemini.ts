/**
 * Gemini API Integration Service
 * This service handles communication with Google's Gemini API for content generation
 */

export interface AITopic {
  title: string;
  description: string;
  category: string;
  content: string;
  keywords: string[];
  trending: boolean;
}

export interface GeneratedContent {
  topics: AITopic[];
  generatedAt: string;
}

class GeminiService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly MODEL_NAME: string;

  constructor() {
    this.API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
    if (!this.API_KEY) {
      console.warn('Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY environment variable.');
    }
    this.MODEL_NAME = process.env.REACT_APP_GEMINI_MODEL || 'gemini-1.5-flash';
  }

  /**
   * Make a request to Gemini API
   */
  private async makeRequest(prompt: string): Promise<string> {
    if (!this.API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const url = `${this.BASE_URL}/${this.MODEL_NAME}:generateContent`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        let msg = `${response.status} ${response.statusText}`;
        try {
          const err = await response.json();
          if (err?.error?.message) msg += ` - ${err.error.message}`;
        } catch {}
        if (response.status === 404) {
          msg += `. Model not found. Set REACT_APP_GEMINI_MODEL (e.g., "gemini-1.5-flash" or "gemini-1.5-pro") and ensure the API is enabled for your project.`;
        }
        throw new Error(`Gemini API request failed: ${msg}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('Gemini API request failed:', error);
      throw new Error(`Failed to get response from Gemini: ${error.message}`);
    }
  }

  /**
   * Parse user-provided AI news text into titles and entries
   * Returns a strict JSON structure with titles and their entries
   */
  async parseManualIngestionText(rawText: string, templateOverride?: string): Promise<{
    titles: Array<{
      title: string;
      description?: string;
      category?: string;
      entries: Array<{ content: string; type?: 'text' | 'image' | 'video' }>;
    }>;
  }> {
    const template = templateOverride || this.getManualIngestionPromptTemplate();
    const prompt = `${template}\n\nInput text (may be long, noisy, and contain multiple items):\n"""\n${rawText}\n"""`;

    const response = await this.makeRequest(prompt);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed || !Array.isArray(parsed.titles)) throw new Error('Invalid structure');
      // Basic normalization: ensure entry types default to text
      parsed.titles.forEach((t: any) => {
        if (Array.isArray(t.entries)) {
          t.entries = t.entries.map((e: any) => ({ content: String(e.content || '').trim(), type: (e.type as any) || 'text' }))
            .filter((e: any) => e.content);
        } else {
          t.entries = [];
        }
      });
      return parsed;
    } catch (e: any) {
      console.error('Failed to parse manual ingestion JSON:', response);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Default prompt template for manual ingestion. Does not include the pasted raw text.
   */
  getManualIngestionPromptTemplate(): string {
    return (
      `You are an assistant that converts a human's pasted AI news text into a clean JSON plan for publication.\n\n` +
      `Task:\n` +
      `- Identify distinct news items/topics.\n` +
      `- For each item, produce a short, compelling title and 1-3 concise entry texts suitable for a social knowledge feed.\n` +
      `- Prefer 'text' entries. Do not invent URLs. Keep facts from the input only.\n` +
      `- If you can infer a category, add one of: "technology", "science", "business", "politics", "philosophy", "general".\n\n` +
      `Respond with STRICT JSON only, no prose, matching exactly this schema:\n` +
      `{"titles":[{"title":"...","description":"...(optional)","category":"technology|science|business|politics|philosophy|general(optional)","entries":[{"content":"...","type":"text"}]}]}`
    );
  }

  /**
   * Search for trending AI topics and generate content
   */
  async generateTrendingAIContent(): Promise<GeneratedContent> {
    const searchPrompt = `
You are an AI research assistant tasked with finding the most trending and newsworthy AI developments from the past week. 

Please search the internet and identify 5-7 of the most significant, trending AI topics that would be interesting to discuss in a social media platform focused on AI and technology. Focus on:

1. Recent AI model releases (like GPT-5, Claude, Gemini updates)
2. Major AI company announcements
3. Breakthrough AI research papers
4. AI regulation and policy changes
5. AI applications in different industries
6. AI safety and ethics developments

For each topic, provide:
- A compelling title (suitable for social media discussion)
- A brief description (2-3 sentences)
- A category (options: "models", "research", "industry", "regulation", "ethics", "applications")
- Detailed content for discussion (3-4 paragraphs, suitable for an entry/post)
- 3-5 relevant keywords

Format your response as JSON:
{
  "topics": [
    {
      "title": "Topic Title",
      "description": "Brief description",
      "category": "category_name", 
      "content": "Detailed content for discussion",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "trending": true
    }
  ]
}

Make sure the content is factual, engaging, and suitable for discussion in a social platform. Focus on recent developments (within the last 7 days if possible).
`;

    try {
      const response = await this.makeRequest(searchPrompt);
      
      // Parse the JSON response
      let parsedResponse: any;
      try {
        // Clean the response to extract JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', response);
        throw new Error('Failed to parse AI response as JSON');
      }

      // Validate the response structure
      if (!parsedResponse.topics || !Array.isArray(parsedResponse.topics)) {
        throw new Error('Invalid response structure from AI');
      }

      return {
        topics: parsedResponse.topics,
        generatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Failed to generate trending AI content:', error);
      throw error;
    }
  }

  /**
   * Generate additional entries for a specific topic
   */
  async generateAdditionalEntries(topic: AITopic, existingEntries: string[] = []): Promise<string[]> {
    const prompt = `
You are contributing to a discussion about: "${topic.title}"

Topic description: ${topic.description}
Category: ${topic.category}

Generate 2-3 additional discussion entries/comments that would add value to this topic. Each entry should:
- Provide a different perspective or insight
- Be engaging and thought-provoking
- Be suitable for social media discussion
- Avoid repeating information from existing entries

Existing entries to avoid duplicating:
${existingEntries.map((entry, i) => `${i + 1}. ${entry.substring(0, 100)}...`).join('\n')}

Format your response as a JSON array of strings:
["Entry 1 content", "Entry 2 content", "Entry 3 content"]

Each entry should be 2-4 sentences long.
`;

    try {
      const response = await this.makeRequest(prompt);
      
      // Parse the JSON response
      let parsedResponse: string[];
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', response);
        throw new Error('Failed to parse AI response as JSON');
      }

      return parsedResponse;
    } catch (error: any) {
      console.error('Failed to generate additional entries:', error);
      throw error;
    }
  }

  /**
   * Get a fallback set of AI topics if API fails
   */
  getFallbackTopics(): GeneratedContent {
    return {
      topics: [
        {
          title: "OpenAI Announces GPT-5 Development Progress",
          description: "Latest updates on GPT-5 capabilities and expected release timeline",
          category: "models",
          content: "OpenAI has provided new insights into GPT-5 development, suggesting significant improvements in reasoning capabilities and multimodal understanding. The new model is expected to handle complex mathematical problems and provide more nuanced responses to ethical dilemmas. Early benchmarks indicate a substantial leap from GPT-4 in terms of accuracy and contextual understanding. What are your thoughts on the potential impact of GPT-5 on various industries?",
          keywords: ["GPT-5", "OpenAI", "language model", "AI development"],
          trending: true
        },
        {
          title: "Google's Gemini Ultra Shows Impressive Reasoning Abilities",
          description: "Google's latest AI model demonstrates advanced problem-solving in complex scenarios",
          category: "models", 
          content: "Google's Gemini Ultra has been making waves with its exceptional performance on reasoning benchmarks, often outperforming human experts in complex logical tasks. The model shows particular strength in mathematical problem-solving and code generation. Researchers are excited about its potential applications in scientific research and educational tools. How do you see this impacting the competitive landscape between AI companies?",
          keywords: ["Gemini Ultra", "Google", "reasoning", "AI competition"],
          trending: true
        },
        {
          title: "EU AI Act Implementation Begins",
          description: "European Union starts enforcing comprehensive AI regulations affecting global tech companies",
          category: "regulation",
          content: "The European Union has begun implementing the AI Act, marking the world's first comprehensive AI regulation framework. This legislation classifies AI systems by risk levels and imposes strict requirements on high-risk applications. Tech companies worldwide are now adapting their AI systems to comply with these new standards. The Act particularly focuses on transparency, accountability, and human oversight in AI decision-making processes.",
          keywords: ["EU AI Act", "regulation", "compliance", "AI governance"],
          trending: true
        }
      ],
      generatedAt: new Date().toISOString()
    };
  }
}

export const geminiService = new GeminiService();
