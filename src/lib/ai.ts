// AI caption generation using OpenAI API

import OpenAI from 'openai';
import { CaptionGenerationRequest, CaptionGenerationResponse, PlatformConfig } from '@/types';
import { getPlatformConfig, getLengthPresets } from './presets';

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export class CaptionGenerator {
  async generateCaptions(request: CaptionGenerationRequest): Promise<CaptionGenerationResponse[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return this.generateFallbackCaptions(request);
      }

      const platformConfig = getPlatformConfig(request.platform);
      const systemPrompt = this.buildSystemPrompt(request.platform, platformConfig);
      const userPrompt = this.buildUserPrompt(request);

      const client = getOpenAI();
      if (!client) {
        return this.generateFallbackCaptions(request);
      }

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content?.trim() || '';
      return this.parseOpenAIResponse(content, request.num_variants);

    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateFallbackCaptions(request);
    }
  }

  private generateFallbackCaptions(request: CaptionGenerationRequest): CaptionGenerationResponse[] {
    const captions: CaptionGenerationResponse[] = [];
    const topic = request.topic;
    const tone = request.tone;
    const platform = request.platform;
    const length = request.length;
    const description = request.description || '';

    // Get target character count based on length and platform
    const targetLength = this.getTargetLength(length, platform);

    const templates: Record<string, string[]> = {
      'Casual': [
        `Hey! Just wanted to share something cool about ${topic}. What do you think?`,
        `So I've been thinking about ${topic} lately... anyone else?`,
        `Quick question about ${topic} - what's your take on this?`
      ],
      'Professional': [
        `Insights on ${topic}: Here's what industry leaders are saying.`,
        `Professional perspective on ${topic} and its impact on business.`,
        `Key considerations for ${topic} in today's market landscape.`
      ],
      'Friendly': [
        `🌟 Let's chat about ${topic}! I'd love to hear your thoughts.`,
        `💙 ${topic} is something I'm really excited about. What about you?`,
        `🤗 Sharing some thoughts on ${topic} - hope you find this helpful!`
      ],
      'Motivational': [
        `💪 Ready to tackle ${topic}? You've got this!`,
        `🚀 ${topic} is your next challenge - are you ready to rise to it?`,
        `⚡ Time to turn ${topic} into your strength. Let's do this!`
      ],
      'Inspirational': [
        `✨ ${topic} reminds us that every journey begins with a single step.`,
        `🌟 The beauty of ${topic} lies in the possibilities it creates.`,
        `💫 ${topic} teaches us that growth happens outside our comfort zone.`
      ],
      'Educational': [
        `📚 Let's break down ${topic} - here's what you need to know.`,
        `🎓 Learning about ${topic}? Here are the key points to remember.`,
        `📖 Understanding ${topic} starts with these fundamental concepts.`
      ],
      'Humorous': [
        `😂 ${topic} - because life's too short to be serious all the time!`,
        `😄 Who else finds ${topic} absolutely hilarious? Just me?`,
        `🤣 ${topic} in a nutshell: *insert relatable chaos here*`
      ],
      'Authoritative': [
        `📊 Data shows that ${topic} delivers measurable results.`,
        `🎯 Industry standards confirm ${topic} as the most effective approach.`,
        `📈 Research validates ${topic} as a proven strategy.`
      ],
      'Conversational': [
        `You know what's interesting about ${topic}? Let me tell you...`,
        `I've been thinking about ${topic} and here's what I've learned.`,
        `Have you ever wondered about ${topic}? Here's my take.`
      ],
      'Trendy': [
        `🔥 ${topic} is trending for a reason - here's why everyone's talking about it.`,
        `✨ ${topic} is the vibe right now. Are you in?`,
        `🚀 ${topic} is having a moment and honestly? We're here for it.`
      ],
      'Authentic': [
        `Real talk about ${topic} - no filters, just honest thoughts.`,
        `${topic} from my perspective - take it or leave it, but it's real.`,
        `Unfiltered thoughts on ${topic} because authenticity matters.`
      ],
      'Bold': [
        `🔥 ${topic} - and I'm not holding back. Here's the truth.`,
        `💥 Bold statement: ${topic} is about to change everything.`,
        `⚡ ${topic} isn't for the faint of heart. Ready to dive in?`
      ],
      'Warm': [
        `💙 ${topic} brings warmth to my heart. What about you?`,
        `🤗 There's something so comforting about ${topic}.`,
        `🌟 ${topic} reminds me why I love what I do.`
      ],
      'Confident': [
        `💪 ${topic} - and I'm confident this will make a difference.`,
        `🎯 Here's why I'm certain about ${topic} and its impact.`,
        `🚀 ${topic} is the way forward, and I stand by that.`
      ],
      'Playful': [
        `🎉 ${topic} is like a fun puzzle - let's solve it together!`,
        `🎈 Who's ready to play with ${topic}? This is going to be good!`,
        `🎪 ${topic} is the main event - grab your popcorn!`
      ]
    };

    const templateList = templates[tone] || templates['Casual'];

    for (let i = 0; i < request.num_variants; i++) {
      let baseTemplate = templateList[i % templateList.length];
      
      // Incorporate description if provided
      if (description.trim()) {
        // Add description context to the template
        const descriptionContext = this.getDescriptionContext(description, tone);
        baseTemplate = baseTemplate.replace(topic, `${topic}${descriptionContext}`);
      }
      
      const caption = this.adjustCaptionLength(baseTemplate, topic, targetLength, request.include_emojis);
      const hashtags = this.generateHashtags(topic, platform);

      captions.push({
        caption,
        hashtags,
        char_count: caption.length
      });
    }

    return captions;
  }

  private buildSystemPrompt(platform: string, config: PlatformConfig): string {
    return `You are an expert social media content creator specializing in ${platform} captions.

Your task is to generate engaging, platform-optimized captions that:
- Match the specified tone and style
- Stay within character limits (${config.char_limit} max, ${config.optimal_chars[0]}-${config.optimal_chars[1]} optimal)
- Include relevant hashtags (${config.hashtag_range[0]}-${config.hashtag_range[1]} hashtags)
- Are authentic and engaging
- Follow ${platform} best practices
- Incorporate any additional context provided by the user

Platform Rules:
- Character limit: ${config.char_limit} characters
- Optimal length: ${config.optimal_chars[0]}-${config.optimal_chars[1]} characters
- Hashtags: ${config.hashtag_range[0]}-${config.hashtag_range[1]} hashtags
- Style: ${config.style}
- Include CTAs: ${config.cta_friendly}
- Emoji friendly: ${config.emoji_friendly}

Always return valid JSON in this exact format:
{
  "captions": [
    {
      "caption": "Your caption text here",
      "hashtags": ["tag1", "tag2", "tag3"],
      "char_count": 123
    }
  ]
}

Do not include markdown code fences or any other formatting.`;
  }


  private parseOpenAIResponse(content: string, numVariants: number): CaptionGenerationResponse[] {
    try {
      // Clean the response
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }

      const data = JSON.parse(cleanedContent);
      const captions = data.captions || [];

      // Ensure we have the right number of captions
      while (captions.length < numVariants) {
        captions.push({
          caption: `Caption ${captions.length + 1}`,
          hashtags: ['socialmedia', 'content'],
          char_count: 50
        });
      }

      return captions.slice(0, numVariants);

    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return this.generateFallbackCaptions({
        platform: 'instagram',
        topic: 'social media',
        tone: 'Authority',
        length: 'medium',
        num_variants: numVariants,
        include_emojis: true
      });
    }
  }

  private generateHashtags(topic: string, platform: string): string[] {
    const config = getPlatformConfig(platform);
    const hashtagCount = Math.floor((config.hashtag_range[1] + config.hashtag_range[0]) / 2);

    // Basic hashtag generation based on topic
    const baseTags = topic.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const hashtags = [baseTags];

    // Add platform-specific tags
    const platformTags: Record<string, string[]> = {
      instagram: ['instagram', 'insta', 'socialmedia', 'content', 'marketing'],
      x: ['twitter', 'x', 'social', 'content'],
      tiktok: ['tiktok', 'viral', 'fyp', 'trending', 'social']
    };

    hashtags.push(...(platformTags[platform.toLowerCase()] || ['socialmedia', 'content']));

    // Add generic tags
    const genericTags = ['motivation', 'inspiration', 'tips', 'growth', 'success'];
    hashtags.push(...genericTags);

    // Remove duplicates and limit count
    const uniqueHashtags = Array.from(new Set(hashtags));
    return uniqueHashtags.slice(0, hashtagCount);
  }

  private getTargetLength(length: string, platform: string): number {
    const lengthPresets = getLengthPresets(platform);
    return lengthPresets[length.toLowerCase()] || lengthPresets.medium;
  }

  private adjustCaptionLength(template: string, topic: string, targetLength: number, includeEmojis: boolean): string {
        const caption = template.replace('${topic}', topic);
    
    // If caption is already close to target length, return as is
    if (Math.abs(caption.length - targetLength) < 20) {
      return caption;
    }

    if (caption.length < targetLength) {
      // Expand the caption
      return this.expandCaption(caption, topic, targetLength, includeEmojis);
    } else {
      // Shorten the caption
      return this.shortenCaption(caption, targetLength);
    }
  }

  private expandCaption(caption: string, topic: string, targetLength: number, includeEmojis: boolean): string {
    const expansions = [
      ` Here's what I've learned about ${topic} and why it matters.`,
      ` The more I explore ${topic}, the more I realize its potential.`,
      ` What's your experience with ${topic}? I'd love to hear your thoughts!`,
      ` There's so much to discover about ${topic} - this is just the beginning.`,
      ` ${topic} has been a game-changer for me, and I think it could be for you too.`,
      ` The key to understanding ${topic} is to start with the basics and build from there.`,
      ` I've been diving deep into ${topic} lately, and here's what I've found.`,
      ` ${topic} isn't just a trend - it's a fundamental shift in how we think about things.`,
      ` When I first started with ${topic}, I had no idea how much it would change my perspective.`,
      ` The beauty of ${topic} lies in its simplicity and the profound impact it can have.`,
      ` Every day I learn something new about ${topic}, and it never ceases to amaze me.`,
      ` ${topic} has taught me that sometimes the best things in life are the ones we least expect.`,
      ` I've discovered that ${topic} isn't just about the destination, but the journey itself.`,
      ` The more I share about ${topic}, the more I realize how many people can relate to this experience.`,
      ` ${topic} reminds me that growth happens when we step outside our comfort zones.`
    ];

    let expanded = caption;
    let expansionIndex = 0;

    while (expanded.length < targetLength - 30 && expansionIndex < expansions.length) {
      expanded += expansions[expansionIndex];
      expansionIndex++;
    }

    // Add emojis if requested
    if (includeEmojis && expanded.length < targetLength) {
      const emojis = ['✨', '🌟', '💡', '🎯', '🚀', '💪', '🔥', '⭐', '💫', '🌈', '🎉', '🎊'];
      expanded += ` ${emojis[Math.floor(Math.random() * emojis.length)]}`;
    }

    return expanded;
  }

  private shortenCaption(caption: string, targetLength: number): string {
    if (caption.length <= targetLength) {
      return caption;
    }

    // Try to shorten by removing less important parts
    let shortened = caption;
    
    // Remove common filler phrases
    const fillers = [
      ' and I think it could be for you too',
      ' and here\'s what I\'ve found',
      ' and why it matters',
      ' and I\'d love to hear your thoughts',
      ' and this is just the beginning',
      ' and I think it could be for you too',
      ' and I\'d love to hear your thoughts!',
      ' and I think it could be for you too!'
    ];

    for (const filler of fillers) {
      if (shortened.includes(filler) && shortened.length > targetLength) {
        shortened = shortened.replace(filler, '');
      }
    }

    // If still too long, truncate at word boundary
    if (shortened.length > targetLength) {
      const truncated = shortened.substring(0, targetLength - 3);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > targetLength * 0.7) {
        shortened = truncated.substring(0, lastSpace) + '...';
      } else {
        shortened = truncated + '...';
      }
    }

    return shortened;
  }


  private buildUserPrompt(request: CaptionGenerationRequest): string {
    let prompt = `Create ${request.num_variants} ${request.tone.toLowerCase()} captions for ${request.platform} about "${request.topic}".`;
    
    if (request.description && request.description.trim()) {
      prompt += `\n\nAdditional context and details:\n${request.description}`;
    }
    
    if (request.keywords && request.keywords.trim()) {
      prompt += `\n\nInclude these keywords: ${request.keywords}`;
    }
    
    if (request.cta && request.cta.trim()) {
      prompt += `\n\nInclude this call-to-action: ${request.cta}`;
    }
    
    prompt += `\n\nLength: ${request.length}`;
    prompt += `\nInclude emojis: ${request.include_emojis ? 'Yes' : 'No'}`;
    
    return prompt;
  }

  private getDescriptionContext(description: string, tone: string): string {
    // Extract key points from description and format them based on tone
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keyPoints = sentences.slice(0, 2); // Take first 2 sentences as key points
    
    if (keyPoints.length === 0) return '';
    
    const contextPhrases: Record<string, string[]> = {
      'Casual': [
        ` - specifically ${keyPoints[0].toLowerCase()}`,
        `, and here's the thing: ${keyPoints[0].toLowerCase()}`,
        ` (${keyPoints[0].toLowerCase()})`
      ],
      'Professional': [
        `, particularly ${keyPoints[0].toLowerCase()}`,
        `, with focus on ${keyPoints[0].toLowerCase()}`,
        `, emphasizing ${keyPoints[0].toLowerCase()}`
      ],
      'Friendly': [
        ` - and what's really cool is ${keyPoints[0].toLowerCase()}`,
        `, especially ${keyPoints[0].toLowerCase()}`,
        `! Here's what I love: ${keyPoints[0].toLowerCase()}`
      ],
      'Motivational': [
        ` - and remember, ${keyPoints[0].toLowerCase()}`,
        `, because ${keyPoints[0].toLowerCase()}`,
        `! The key is ${keyPoints[0].toLowerCase()}`
      ],
      'Educational': [
        `, specifically ${keyPoints[0].toLowerCase()}`,
        `, and it's important to note that ${keyPoints[0].toLowerCase()}`,
        `, with the key point being ${keyPoints[0].toLowerCase()}`
      ]
    };
    
    const phrases = contextPhrases[tone] || contextPhrases['Casual'];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    return randomPhrase;
  }
}
