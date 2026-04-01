import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
app.post('/analyze', async (req, res) => {
    try {
        const { prompt } = req.body;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
        });
        res.json({ result: message.content[0].text });
    } catch (error) {
        console.error('Anthropic API error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
app.listen(3001, () => {
    console.log('Proxy server running on http://localhost:3001');
});