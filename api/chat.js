exports.handler = async function(event, context) {
    // POST 요청만 허용
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    // OpenRouter API 키 확인 (Netlify/Vercel 환경 변수)
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

        // 다국어 수용 및 코딩 전문 페르소나 적용 시스템 프롬프트
        const systemPrompt = {
            role: "system",
            content: "You are Code Jun, a highly capable coding assistant. Always answer accurately and naturally in the exact same language that the user uses in their request."
        };

        // 전달받은 messages 내역 중 이미 system 프로필이 포함되어 있으면 그대로 사용하고, 아니면 시스템 프롬프트를 맨 앞에 추가
        let finalMessages = messages || [];
        if (!finalMessages.some(m => m.role === 'system')) {
            finalMessages = [systemPrompt, ...finalMessages];
        }

        // OpenRouter 호출
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://code-jun.netlify.app", // 서비스 주소
                "X-Title": "Code Jun AI"
            },
            body: JSON.stringify({
                model: model || "openrouter/free", // 기본 무료 라우터 지정
                messages: finalMessages
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
