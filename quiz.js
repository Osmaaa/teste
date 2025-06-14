// ==Quiz Auto IA==
// Responde quizzes automaticamente usando a API da OpenAI.
// Use somente em sites que você controla ou tem autorização.

// === CONFIGURAÇÃO ===
// O script solicitará a sua API Key da OpenAI via prompt para garantir segurança.
const OPENAI_API_KEY = prompt("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");

// Modifique os seletores conforme seu site/quiz!
function getPerguntaDivs() {
  // Cada pergunta deve estar dentro de um elemento com a classe 'pergunta'
  return Array.from(document.querySelectorAll('.pergunta'));
}

function extrairTextoPergunta(div) {
  // Ajuste para encontrar o elemento de texto da pergunta
  const el = div.querySelector('span, p, h3, h2, .texto-pergunta');
  return el ? el.innerText.trim() : div.innerText.trim();
}

function extrairAlternativas(div) {
  // Suporta <select> e radio buttons
  const select = div.querySelector('select');
  if (select) return Array.from(select.options).map(opt => opt.textContent.trim());
  // Alternativa: radio buttons com labels
  const radios = div.querySelectorAll('input[type="radio"]');
  if (radios.length) {
    // Supondo que cada radio tem um label associado
    return Array.from(radios).map(radio => {
      const label = div.querySelector(`label[for="${radio.id}"]`);
      return label ? label.textContent.trim() : radio.value;
    });
  }
  return [];
}

function marcarAlternativa(div, resposta) {
  // Marca no <select>
  const select = div.querySelector('select');
  if (select) {
    const idx = Array.from(select.options).findIndex(
      opt => opt.textContent.trim().toLowerCase() === resposta.trim().toLowerCase()
    );
    if (idx >= 0) {
      select.selectedIndex = idx;
      select.dispatchEvent(new Event('change'));
      return true;
    }
  }
  // Marca radio button
  const radios = div.querySelectorAll('input[type="radio"]');
  for (const radio of radios) {
    const label = div.querySelector(`label[for="${radio.id}"]`);
    if (
      label &&
      label.textContent.trim().toLowerCase() === resposta.trim().toLowerCase()
    ) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change'));
      return true;
    }
  }
  return false;
}

async function consultarIA(pergunta, alternativas) {
  const prompt = `Leia a pergunta abaixo e diga qual alternativa está correta. Apenas responda com o texto exato da alternativa correta, sem explicações.
Pergunta: "${pergunta}"
Alternativas: ${alternativas.map((alt, i) => `[${i+1}] ${alt}`).join(' | ')}
Responda apenas com o texto da alternativa correta.`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{role: "user", content: prompt}],
      max_tokens: 30,
      temperature: 0
    })
  });
  const data = await response.json();
  if (
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
  ) {
    return data.choices[0].message.content.replace(/^[\d\.\-\s]+/, '').trim();
  }
  throw new Error("Erro ao consultar IA: " + (data.error ? data.error.message : "Resposta inesperada"));
}

async function rodarQuizAutoIA() {
  const perguntas = getPerguntaDivs();
  for (const div of perguntas) {
    const texto = extrairTextoPergunta(div);
    const alternativas = extrairAlternativas(div);
    if (!texto || alternativas.length === 0) continue;
    try {
      div.style.outline = '2px solid orange';
      const resposta = await consultarIA(texto, alternativas);
      const marcou = marcarAlternativa(div, resposta);
      div.style.outline = marcou ? '2px solid green' : '2px solid red';
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      div.style.outline = '2px solid red';
      console.error("Erro ao responder pergunta:", e);
    }
  }
  alert('Quiz respondido automaticamente!');
}

(async () => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 20) {
    alert("API Key inválida. O script será encerrado.");
    return;
  }
  await rodarQuizAutoIA();
})();
