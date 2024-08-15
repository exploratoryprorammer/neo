import { NextResponse } from "next/server";
import OpenAI from "openai";



const systemprompt = "I’m your AI assistant for asteroid detection and monitoring. I’m here to help you with a variety of tasks, including explaining our asteroid detection methods, clarifying alerts and their implications, and guiding you through our database to find specific asteroid information. If you encounter any technical issues with the software, I can assist with troubleshooting. I’m also available to provide educational insights about asteroids and their role in our solar system. Feel free to ask me anything you need—I’m here to make your experience as smooth and informative as possible!"

export async function POST(req) {
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY
      })    
      // const llama = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const data = await req.json();

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemprompt
            },
            ...data
        ],
        model: "meta-llama/llama-3.1-8b-instruct:free",
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if(content){
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            }
            catch(error)
            {
                controller.error(error)
            }
            finally{
                controller.close()
            }
        },
            
    })
    return new NextResponse(stream);
    
}


// export async function POST(req) {
//     const genAI = new GoogleGenerativeAI(process.env.API_KEY);
//     const data = await req.json()
//     const completion = await genAI.chat.completions.create({
//         messages: [
//             {
//                 role: 'system',
//                 content: systemprompt,
//             },
//             ...data
//         ],
//         model: '',
//         stream: true,
//     })
//     const stream = new ReadableStream({
//         async start(controller) {
//             const encoder = new TextEncoder();
//             try {
//                 for await (const chunk of completion){
//                     const content = chunk.choices[0].delta.content
//                     if(content){
//                         const text = encoder.encode(content)
//                         controller.enqueue(text)
//                     }
//                 }
                
//             } catch (error) {
//                 controller.error(error)
//             }
//             finally {
//                 controller.close()
//             }
//         },
//     })
    
//     return new NextResponse(stream);
// }