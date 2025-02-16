require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
import express from "express";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import cors from "cors";



const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const app = express()
app.use(cors())
app.use(express.json())

app.post("/template", async(req, res) => {
    const prompt = req.body.prompt
    try {
        const content = [
            {
                role: "user",
                parts: [{ text: prompt}]
            },
            {
                role: "user",
                parts: [{ text: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"}]
            },
        ];
     
        const result = await model.generateContent({contents: content});
        const answer = result.response.text();
        if (answer == "react"){
            res.json({
                prompts: [
                    BASE_PROMPT,
                    `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`
                ],
                uiPrompts: [reactBasePrompt]
            });
            return;
            
        }
        if (answer == "node"){
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`],
                uiPrompts: [nodeBasePrompt]
            })
            return
        }
        res.status(403).json({msg: "You cannot access this"})
        return
    }catch(e){
        console.log(e)
    }

})

app.post('/chat', async (req, res) => {
    const messages = req.body.messages;
    messages.splice(2, 0, {
        role: "model",
        parts: [{ text: getSystemPrompt() }]
    });
    messages.splice(3, 0, {
        role: "user",
        parts: [{ text: "Take care that all react files are in .jsx format and javascript files in .js format do not give code in .tsx or .ts and Give code for all files in the format specified by model text do not give partial code" }]
    });

    try {
        const result = await model.generateContentStream({ contents: messages });

        // Set response headers for streaming
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');
        let code = ""
        for await (const chunk of result.stream) {
            const textChunk = chunk.text();
            code += textChunk
            // res.write(textChunk); // Send each chunk to the client
            process.stdout.write(textChunk); // Log it in the terminal (optional)
        }
        res.json({code})

        res.end(); // End the response stream when done

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).send("Error communicating with Gemini API");
    }
});


async function main() {
    const content = [
        {
            role: "user",
            parts: [{ text: "For all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.\n\nBy default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.\n\nUse icons from lucide-react for logos.\n\nUse stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.\n\n" }]
        },
        {
            role: "user",
            parts: [{ text: `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n - .bolt/prompt` }]
        },
        {
            role: "model",
            parts: [{ text: getSystemPrompt() }]
        },
        {
            role: "user",
            parts: [{ text: "Create a todo app" }]
        },
    ];

    const result = await model.generateContentStream({ contents: content });

    for await (const chunk of result.stream) {
        process.stdout.write(chunk.text());
    }
}

// main();
app.listen(3000)