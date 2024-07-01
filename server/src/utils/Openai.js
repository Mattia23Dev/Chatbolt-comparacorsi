const OpenAI = require('openai');

module.exports = class OpenAIChat {
    constructor({ apiKey, model }) {
        this.apiKey = apiKey;
        this.model = model;

        this.openai = new OpenAI({apiKey: this.apiKey});
    }

    async getOpenAIResponse(messagesContent, sistemaPromptIniziale) {
        try {
            const responseToUser = await this.openai.chat.completions.create({
                messages: [
                    { role: 'user', content: messagesContent },
                    { role: 'system', content: sistemaPromptIniziale }
                ],
                model: "gpt-4o"
            });
            const replyToUser = responseToUser.choices[0]?.message?.content.trim();
            console.log(replyToUser)
            return replyToUser;
        } catch (error) {
            console.error('Errore durante la richiesta all\'API di OpenAI:', error);
            throw new Error('Errore durante la richiesta all\'API di OpenAI');
        }
    }

    async saveInfoLead(messagesContent, sistemaPromptIniziale) {
        try {
            const responseToUser = await this.openai.chat.completions.create({
                messages: [
                    { role: 'user', content: messagesContent },
                    { role: 'system', content: sistemaPromptIniziale }
                ],
                model: "gpt-4o"
            });
            const replyToUser = responseToUser.choices[0]?.message?.content.trim();
            console.log(replyToUser)
            return replyToUser;
        } catch (error) {
            console.error('Errore durante la richiesta all\'API di OpenAI:', error);
            throw new Error('Errore durante la richiesta all\'API di OpenAI');
        }
    }
}