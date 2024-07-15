const { saveMessageOrChat, saveInfoLeadDb } = require("./MongoDB");
const { sendTemplateMessage } = require("./WhatsappCloudApi");

exports.extractJSONFromOpenAIResponse = (response) => {
    const trimmedResponse = response.trim();
    const cleanedResponse = trimmedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    try {
        return JSON.parse(cleanedResponse);
    } catch (error) {
        const jsonMatch = cleanedResponse.match(/\{.*\}/s);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerError) {
                console.error("Errore nel parsing del JSON estratto:", innerError);
            }
        }
        
        console.error("Impossibile estrarre un JSON valido dalla risposta:", error);
        return {
            first_name: "",
            last_name: "",
            email: "",
            conversation_summary: "",
            appointment_date: ""
        };
    }
}

const replacePlaceholder = (template, value) => {
    return template.replace('{{1}}', value);
  };

  const formatPhoneNumber = (numeroTelefono) => {
    let cleanedNumber = numeroTelefono.replace(/[\s-()]/g, '');
    
    if (cleanedNumber.startsWith('+39') && cleanedNumber.length > 10) {
      return cleanedNumber.substring(1);
    } else if (cleanedNumber.startsWith('39') && cleanedNumber.length > 12) {
      return cleanedNumber;
    } else if (!cleanedNumber.startsWith('39') || (cleanedNumber.startsWith('39') && cleanedNumber.length === 10)) {
      return '39' + cleanedNumber;
    }
    
    return cleanedNumber;
  };  

exports.processTriggerNode = async (trigger, userInfo, phoneNumberId, flow, projectId, clientId) => {
    switch (trigger.actionType) {
      case 'email':
        console.log('Sending Email...');
        //await sendEmail(node.data.templateEmail, userInfo);
        break;

      case 'whatsapp':
        console.log('Sending WhatsApp Template...');
        const templateName = trigger.templateWhatsapp.name;
        const template = trigger.templateWhatsapp;
        const message = trigger?.selectedComponent?.text
        const phoneDestination = formatPhoneNumber(userInfo.numeroTelefono);
        const hasParameters = template.components.some(component =>
            component.type === 'BODY' && /{{\d+}}/.test(component.text)
          );
        
        let params = [];
          if (hasParameters) {
            params = template.components.map((component, index) => ({
              text: `${userInfo.nome}`
            }));
          }
        const personalizedMessage = replacePlaceholder(message, userInfo.nome);

        const chat = await saveMessageOrChat({
            userId: userInfo._id,
            leadId: userInfo._id,
            flowId: flow?._id,
            projectId: projectId,
            clientId: clientId,
            numeroTelefono: phoneDestination,
            content: personalizedMessage,
            sender: 'user',
            tag: trigger.tag,
          });

        await saveInfoLeadDb(userInfo, projectId)
        
        await sendTemplateMessage(templateName, template?.language, params, phoneNumberId, phoneDestination);
        break;
  
      default:
        console.log(`Unknown action type: ${trigger.actionType}`);
    }
  };