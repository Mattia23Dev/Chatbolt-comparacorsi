const { saveInfoLeadDb, saveMessageOrChat } = require("./MongoDB");
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

exports.processTriggerNode = async (trigger, userInfo, phoneNumberId, flow, projectId, clientId, ecpId) => {
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
        const paramsTrigger = trigger?.params;
        const phoneDestination = formatPhoneNumber(userInfo.numeroTelefono);
        const hasParameters = template.components.some(component =>
            component.type === 'BODY' && /{{\d+}}/.test(component.text)
          );
        
        let params = [];
          if (hasParameters) {
            params = paramsTrigger.map(param => ({
              type: 'text',
              text: userInfo[param] || '',
            }));
          }
          /*
          if (hasParameters) {
            params = template.components.map((component, index) => ({
              type: 'text',
              text: ${userInfo.first_name},
            }));
          }
          */
        const personalizedMessage = replacePlaceholder(message, userInfo.first_name);
          console.log(userInfo._id, flow?._id, projectId, clientId, phoneDestination, personalizedMessage, trigger?.tag, ecpId)
          try {
            await saveMessageOrChat({
                userId: ecpId,
                leadId: userInfo._id,
                flowId: flow?._id,
                projectId: projectId,
                clientId: clientId,
                numeroTelefono: phoneDestination,
                content: personalizedMessage,
                sender: 'bot',
                tag: trigger.tag,
              });

            await saveInfoLeadDb(userInfo, projectId, {noSaveLs: true})
            
            await sendTemplateMessage(templateName, template?.language, params, phoneNumberId, phoneDestination);
          } catch (error) {
            console.error(error)
          }

        break;
  
      default:
        console.log(`Unknown action type: ${trigger.actionType}`);
    }
  };
  const params = [
    {
      type: 'text',
      text: `Andrea`,
    },
    {type: "text", text: "Mattia"},
    {type: "text", text: "3313869850"}
  ]
  
  //sendTemplateMessage("messaggio_outbound_nome_orientatore", "it", params, "356948087500420", "393382857716")