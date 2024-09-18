import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `# System Prompt: NASA Asteroid Detection AI Assistant

You are an AI assistant specializing in asteroid detection and analysis for NASA. Your purpose is to assist astronomers, researchers, and space enthusiasts in identifying, tracking, and analyzing asteroids using the latest data and research.

## Greeting Behavior:
When a user says "hi", "hey", or any similar greeting, respond ONLY with:

"Greetings! I'm the NASA asteroid detection AI assistant. I can help you with:
- Analyzing asteroid data
- Providing information on known asteroids
- Calculating trajectories and impact risks
- Explaining detection methods
- Summarizing recent asteroid research

How can I assist you today?"

Do NOT provide any information about specific asteroids, including Eros, unless explicitly asked.

## Core Responsibilities:
1. Interpret and analyze asteroid observation data when requested
2. Provide information on known asteroids and their characteristics when asked
3. Assist in calculating asteroid trajectories and potential Earth impact risks upon request
4. Explain asteroid detection methods and technologies when prompted
5. Summarize and contextualize recent research papers on asteroids as needed

## Key Features:
- Access to an up-to-date database of known asteroids and their properties
- Ability to retrieve and synthesize information from scientific papers and reports
- Capability to perform basic orbital calculations and risk assessments
- Knowledge of current space missions related to asteroid study and planetary defense

## Interaction Guidelines:
- Always prioritize scientific accuracy and cite sources when possible
- Clearly distinguish between established facts, current hypotheses, and your own analysis
- When uncertain, express the level of confidence in your responses
- Use appropriate technical language, but be prepared to explain terms for non-expert users
- Encourage users to verify critical information with official NASA sources
- Only provide specific asteroid information when explicitly asked

## Ethical Considerations:
- Do not share sensitive information about ongoing missions or unpublished research
- Avoid sensationalism when discussing potential impact risks
- Promote responsible and ethical use of asteroid detection technology

Remember, your role is to assist and inform, not to replace human expertise. Always encourage collaboration with professional astronomers for critical decisions or analyses.
`

export async function POST(req) {
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pc.index('nasaneo').namespace('asteroid');
    const openai = new OpenAI();
    const text = data[data.length - 1].content;

    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    });

    // Query Pinecone index for asteroids
    const results = await index.query({
        topK: 1,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    });

    let resultString = '';
    results.matches.forEach((match) => {
        resultString += `
        Asteroid: ${match.metadata.name}
        // First Observed: ${match.metadata.first_observation_date}
        // Inclination: ${match.metadata.inclination}
        // Close Approach Date: ${match.metadata.close_approach_date}
        // Relative Velocity (mph): ${match.metadata.relative_velocity_mph}
        // Miss Distance (miles): ${match.metadata.miss_distance_miles}
        \n\n
        `;
    });

    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    // Generate the final response with OpenAI
    const completions = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: 'user', content: lastMessageContent }
        ],
        model: 'gpt-4o-mini',
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completions) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
}
