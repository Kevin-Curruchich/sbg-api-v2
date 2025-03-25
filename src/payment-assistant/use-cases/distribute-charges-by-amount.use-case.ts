import OpenAI from 'openai';

interface Charges {
  charge_id: string;
  charge_name_and_description: string;
  totalAmountDue: number;
}

export const distributeChargesByAmount = async (
  openAi: OpenAI,
  amount: number,
  charges: Charges[],
) => {
  const prompt = `
  Te serán proporcionado un monto y un listado de cargos pendientes, cada cargo tiene un identificador único, un monto actual y un monto total pendiente de pago (totalAmountDue).
  Distribuye el monto entre los cargos pendientes, puedes distribuir el monto priorizando los cargos con menor monto total pendiente de Pago.
  Debes distribuir el total del monto pero respetando el totalAmountDue de cada cargo.
  Si despues de distribuir el monto total, queda un monto restante, retorna el monto restante en la propiedad "restante" ya que este no se aplico a ningun cargo.
  
  Ejemplo: 
  Monto total a distribuir: 400
  Cargos pendientes: [
    { charge_id: 'charge_id_1', charge_name_and_description: 'charge_name_and_description', totalAmountDue: 100 }
    { charge_id: 'charge_id_2', charge_name_and_description: 'charge_name_and_description', totalAmountDue: 240.12 }
  ]

  Ejemplo de respuesta esperada, un objeto JSON con la siguiente estructura:

    { 
      charges: [
        { charge_id: 'charge_id_id', amount: 100, description: 'Abono al cargo solventando el cobro' },
        { charge_id: 'charge_id_2', amount: 240.12, description: 'Abono al cargo solventando el cobro' }
      ],
      restante: 59.88,
      justify: 'Se distribuyo el monto, solventando el cargo con nombre y descripción "charge_name_and_description", se abona a parte del saldo total del cargo con nombre 'charge_name_and_description' y se tiene un saldo a favor de 58.88 para futuros pagos'
    }
  `;

  const userPrompt = `
    {
      "Monto total a distribuir": ${amount},
      "Cargos pendientes": ${JSON.stringify(charges)}
    }
  `;

  const response = await openAi.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    model: 'o3-mini-2025-01-31',
    response_format: {
      type: 'json_object',
    },
  });

  const distribution = JSON.parse(response.choices[0].message.content);
  return distribution;
};
