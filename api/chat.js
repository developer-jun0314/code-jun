exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'API 키가 설정되지 않았습니다. OPENROUTER_API_KEY 환경변수를 확인하세요.' }),
        };
    }

    try {
        const { model, messages } = JSON.parse(event.body || '{}');

        // 허세/군더더기 싹 뺀 군더더기 제로 군살 없는 지침
        const systemPrompt = {
            role: "system",
            content: `
당신은 'Code Jun'이라는 코딩 도우미입니다.

[답변 절대 규칙]
1. 자기소개, 경력 자랑, 잡담("저는 N년 차 개발자입니다", "요즘은 뭘 연구하고 있으며~" 등)은 절대 하지 마세요.
2. 서론(인사말, "좋은 질문입니다", "AI로서~") 및 결론 요약 단락을 생략하고, 질문에 대한 핵심 정답/코드만 바로 답변하세요.
3. 단순 인사(예: "안녕", "반가워")에는 "안녕하세요! 무엇을 도와드릴까요?" 수준으로 아주 짧고 담백하게만 응답하세요.
4. 쓸데없이 훈수 두거나 되묻지 말고, 요청한 질문에 직관적이고 정확하게만 답하세요.
`
        };

        let finalMessages = messages || [];
        if (!finalMessages.some(m => m.role === 'system')) {
            finalMessages = [systemPrompt, ...finalMessages];
        }

        const selectedModel = "openrouter/free";

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://code-jun.netlify.app",
                "X-Title": "Code Jun AI"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: finalMessages,
                temperature: 0.3 // 잡소리 방지 및 완전 직관적인 답변용 Low Temp
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: data.error?.message || "OpenRouter API 호출 중 오류가 발생했습니다." }),
            };
        }

        const reply = data.choices && data.choices[0] ? data.choices[0].message.content : "";
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
