import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import { getCohere, generateQueryEmbedding } from '@/lib/cohere';
import { getPineconeIndex } from '@/lib/pinecone';
import { generateChatFallback } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();

    // 1. Hybrid Search for Context
    let contextItems: any[] = [];
    let contextString = "";

    try {
      console.log('[Chat API] Analyzing intent...');
      const lowerMsg = message.toLowerCase();
      
      // Temporal patterns
      const isToday = lowerMsg.includes('aaj') || lowerMsg.includes('today');
      const isYesterday = lowerMsg.includes('kal') || lowerMsg.includes('yesterday');
      const isThisWeek = lowerMsg.includes('is hafte') || lowerMsg.includes('this week');
      const isAll = lowerMsg.includes('sab') || lowerMsg.includes('all') || lowerMsg.includes('everything') || lowerMsg.includes('kitne');

      if (isToday || isYesterday || isThisWeek) {
        const start = new Date();
        if (isYesterday) start.setDate(start.getDate() - 1);
        if (isThisWeek) start.setDate(start.getDate() - 7);
        start.setHours(0,0,0,0);
        
        const end = new Date();
        if (isYesterday) { end.setDate(end.getDate() - 1); }
        end.setHours(23,59,59,999);

        const temporalItems = await Item.find({ 
          createdAt: { $gte: start, $lte: end } 
        }).select('title content summary type url tags source siteName favicon metadata createdAt').lean();
        
        contextItems = [...temporalItems];
      }

      if (isAll) {
        const allItems = await Item.find({ isArchived: false })
          .sort({ createdAt: -1 })
          .limit(30)
          .select('title content summary type url tags source siteName metadata createdAt')
          .lean();
        
        const existingIds = new Set(contextItems.map(i => i._id.toString()));
        allItems.forEach(item => {
          if (!existingIds.has(item._id.toString())) contextItems.push(item);
        });
      }

      // Vector search — run for semantic matching, but don't fail if Pinecone is unavailable
      try {
        const queryEmbedding = await generateQueryEmbedding(message);
        if (queryEmbedding && queryEmbedding.length > 0) {
          const index = await getPineconeIndex();
          const pineconeResults = await index.query({
            vector: queryEmbedding,
            topK: 8,
            filter: { type: 'item' },
            includeMetadata: true,
          });

          const matches = pineconeResults?.matches || [];
          if (matches.length > 0) {
            const contextIds = matches.map(m => (m.metadata as any).itemId);
            const existingIds = new Set(contextItems.map(i => i._id.toString()));
            const vectorItems = await Item.find({ 
              _id: { $in: contextIds, $nin: Array.from(existingIds) } 
            }).select('title content summary type url tags source siteName metadata createdAt').lean();
            
            contextItems = [...contextItems, ...vectorItems];
          }
        }
      } catch (vectorError: any) {
        console.warn('[Chat API] Vector search failed (falling back to DB only):', vectorError.message);
      }

      // If no items found yet via temporal/all/vector, do a text search as last resort
      if (contextItems.length === 0) {
        const textResults = await Item.find({ 
          $text: { $search: message } 
        }).select('title content summary type url tags source siteName metadata createdAt').limit(10).lean();
        contextItems = textResults;
      }

      // Still nothing? Grab the most recent items
      if (contextItems.length === 0) {
        const recentItems = await Item.find({ isArchived: false })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('title content summary type url tags source siteName metadata createdAt')
          .lean();
        contextItems = recentItems;
      }

      // Build detailed context string
      contextString = contextItems.map((item, idx) => {
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { 
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
          hour12: true
        }) : 'Unknown';
        
        const tags = item.tags?.length > 0 ? `Tags: ${item.tags.join(', ')}` : '';
        const hashtags = item.metadata?.hashtags?.length > 0 ? `Hashtags: #${item.metadata.hashtags.join(' #')}` : '';
        const author = item.metadata?.author ? `Author: ${item.metadata.author}` : '';
        const readTime = item.metadata?.wordCount ? `Read Time: ~${Math.ceil(item.metadata.wordCount / 200)} min` : '';
        
        return `=== ITEM ${idx + 1} ===
Title: ${item.title}
Type: ${item.type}
Source: ${item.siteName || item.source || 'Unknown'}
URL: ${item.url || 'N/A'}
Saved On: ${dateStr}
${author}
${tags}
${hashtags}
${readTime}
Summary: ${item.summary || item.content?.slice(0, 500) || 'No summary'}
==================`;
      }).join('\n\n');
    } catch (ragError: any) {
      console.warn('[Chat API] Hybrid Search Failed:', ragError.message);
    }

    // 2. Advanced System Prompt
    const cohere = getCohere();
    
    const chatHistory = history
      .map((h: any) => ({
        role: h.role === 'USER' ? 'USER' : 'CHATBOT',
        message: h.message || h.content || ''
      }))
      .filter((h: any) => h.message && h.message.trim().length > 0);

    const totalItems = await Item.countDocuments({ isArchived: false });
    const totalTags = await Item.distinct('tags', { isArchived: false });

    const systemPrompt = `You are "Monolithic Intelligence" — an advanced AI cognitive assistant for a personal knowledge management system called "Monolithic Curator" (MC).

## Your Brain Stats
- Total Fragments Stored: ${totalItems}
- Total Unique Tags: ${totalTags.length}
- Context Items Retrieved: ${contextItems.length}

## Language Rules
- If user asks in Hindi/Hinglish → reply in **Hinglish** (conversational Hindi-English mix). Keep it natural, modern, and friendly.
- If user asks in English → reply in **English**.
- NEVER use pure formal Hindi.
- Use emojis sparingly for friendliness.

## Intelligence Rules
1. **Think before answering**: Analyze EVERY item in your context carefully. Don't miss any detail.
2. **Be specific**: Always mention item Titles, Types, Sources, and Saved Dates.
3. **Be complete**: If asked about "today/aaj" — list EVERY item saved today with full details. Don't summarize if there are few items.
4. **Temporal awareness**: 
   - "Aaj" = Today = ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
   - "Kal" = Yesterday
   - "Is hafte" = This week
5. **Provide value**: After listing items, add insights like patterns, connections between items, or suggestions.
6. **Format well**: Use bullet points, bold text for titles, and clear structure.
7. **If no data**: Honestly say you don't have relevant info rather than making things up.

${contextItems.length > 0 ? `## Retrieved Knowledge Context
${contextString}` : "## No relevant items found in the brain for this query."}`;

    let chatResponse;
    try {
      chatResponse = await cohere.chat({
        model: 'command-r-plus-08-2024',
        message: message,
        chatHistory: chatHistory,
        preamble: systemPrompt,
      });
    } catch (modelError: any) {
      console.warn('Primary model failed, trying fallback:', modelError?.message);
      try {
        chatResponse = await cohere.chat({
          model: 'command-r-08-2024',
          message: message,
          chatHistory: chatHistory,
          preamble: systemPrompt,
        });
      } catch (cohereFails: any) {
        console.warn('Cohere failed, falling back to OpenAI...', cohereFails.message);
        const openaiResponse = await generateChatFallback(message, chatHistory, systemPrompt);
        if (openaiResponse) {
           return NextResponse.json({ 
            response: openaiResponse,
            citations: [],
            context: contextItems.map(i => ({ _id: i._id, title: i.title, url: i.url, type: i.type }))
          });
        }
        throw cohereFails;
      }
    }

    return NextResponse.json({ 
      response: chatResponse.text,
      citations: (chatResponse as any).citations,
      context: contextItems.map(i => ({ _id: i._id, title: i.title, url: i.url, type: i.type }))
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ 
      error: 'Neural synthesis failed', 
      details: error.message 
    }, { status: 500 });
  }
}
