exports.extractJSONFromOpenAIResponse = (response) => {
    // Rimuove spazi bianchi all'inizio e alla fine
    const trimmedResponse = response.trim();

    // Rimuove i backtick e la parola "json" se presenti
    const cleanedResponse = trimmedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    try {
        // Prova a parsare direttamente la stringa pulita
        return JSON.parse(cleanedResponse);
    } catch (error) {
        // Se il parsing diretto fallisce, cerca di estrarre il JSON
        const jsonMatch = cleanedResponse.match(/\{.*\}/s);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerError) {
                console.error("Errore nel parsing del JSON estratto:", innerError);
            }
        }
        
        console.error("Impossibile estrarre un JSON valido dalla risposta:", error);
        // Restituisce un oggetto vuoto se non riesce a estrarre un JSON valido
        return {
            first_name: "",
            last_name: "",
            email: "",
            conversation_summary: "",
            appointment_date_time: ""
        };
    }
}
  