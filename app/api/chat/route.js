import { NextResponse } from "next/server";
import Groq from "groq-sdk";



const systemprompt = "Welcome to the US Election Information Chatbot! I'm here to help you navigate through the latest updates, data, and insights about the US elections. Whether you need information on election results, candidate profiles, voter registration, or upcoming election dates, just ask! I can also assist with finding data by state or city, understanding election laws, and providing resources for voters. How can I assist you today?"

export async function POST(req) {
    const llama = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const data = await req.json();

    const completion = await llama.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemprompt
            },
            ...data
        ],
        model: 'llama3-70b-8192',
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