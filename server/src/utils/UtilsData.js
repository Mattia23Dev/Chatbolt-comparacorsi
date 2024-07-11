exports.defaultFlowData = {
    nodes: [
      {
        id: "h93arosDmQNZEhbqyLfOG",
        type: "waitNode",
        position: { x: -99.69392609236694, y: 99.76753693895904 },
        data: { 
            label: "waitNode node",
            customType: "wait",
            action: "waitAction",
            number: 0,
            waitingTime: 20,
         },
        width: 118,
        height: 69,
        selected: true,
        positionAbsolute: { x: -99.69392609236694, y: 99.76753693895904 },
        dragging: false
      },
      {
        id: "Tbj_-Z5oPb0ZhWztSlb0p",
        type: "llmNode",
        position: { x: 69.92394815646105, y: 228.00475050078137 },
        data: {
            label: "llmNode node",
            service: "Openai",
            customType: "response",
            action: "responseLLM",
            number: 1,
            prompt: "",
         },
        width: 102,
        height: 69,
        selected: false,
        positionAbsolute: { x: 69.92394815646105, y: 228.00475050078137 },
        dragging: false
      },
      {
        id: "1g44ricPFFemecoGD-XhQ",
        type: "saveInfoNode",
        position: { x: 238.07472060247625, y: 319.910451101719 },
        data: { 
            label: "saveInfoNode node",
            customType: "saveInfo",
            action: "saveInfo",
            infoType: [
              {name: "first_name", type: "string"},
              {name: "last_name", type: "string"},
              {name: "email", type: "string"},
              {name: "numeroTelefono", type: "string"},
              {name: "conversation_summary", type: "string"},
              {name: "appointment_date", type: "string"}
            ],
            number: 2,
        },
        width: 135,
        height: 69,
        selected: false,
        positionAbsolute: { x: 238.07472060247625, y: 319.910451101719 },
        dragging: false
      },
      {
        id: "CsTrnWEsvuptIln0Z3rHi",
        type: "llmNode",
        position: { x: 442.7819660954442, y: 227.753285436615 },
        data: { 
            label: "llmNode node",
            customType: "save",
            action: "saveInfoPrompt",
            number: 3,
            service: "Openai",
            prompt: "",
        },
        width: 102,
        height: 69,
        selected: false,
        positionAbsolute: { x: 442.7819660954442, y: 227.753285436615 },
        dragging: false
      },
      {
        id: "ajt8BHtKSo88k1S9ISutz",
        type: "messageNode",
        position: { x: 608.5125698241161, y: 106.94970438452157 },
        data: { 
            label: "messageNode node",
            customType: "LMMResponse",
            action: "LMMResponse",
            number: 4,
        },
        width: 175,
        height: 69,
        selected: false,
        positionAbsolute: { x: 608.5125698241161, y: 106.94970438452157 },
        dragging: false
      }
    ],
    edges: [
      {
        source: "h93arosDmQNZEhbqyLfOG",
        target: "Tbj_-Z5oPb0ZhWztSlb0p",
        id: "reactflow__edge-h93arosDmQNZEhbqyLfOG-Tbj_-Z5oPb0ZhWztSlb0p"
      },
      {
        source: "Tbj_-Z5oPb0ZhWztSlb0p",
        target: "1g44ricPFFemecoGD-XhQ",
        id: "reactflow__edge-Tbj_-Z5oPb0ZhWztSlb0p-1g44ricPFFemecoGD-XhQ"
      },
      {
        source: "1g44ricPFFemecoGD-XhQ",
        target: "CsTrnWEsvuptIln0Z3rHi",
        id: "reactflow__edge-1g44ricPFFemecoGD-XhQ-CsTrnWEsvuptIln0Z3rHi"
      },
      {
        source: "CsTrnWEsvuptIln0Z3rHi",
        target: "ajt8BHtKSo88k1S9ISutz",
        id: "reactflow__edge-CsTrnWEsvuptIln0Z3rHi-ajt8BHtKSo88k1S9ISutz"
      }
    ]
  };