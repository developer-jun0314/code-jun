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

        // AI가 너무 딱딱하지도, 멍청하지도 않게 조율하는 전담 개발자 시스템 프롬프트
        const systemPrompt = {
            role: "system",
            content: `
[정체성 및 역할]
당신은 'Code Jun'이라는 5년 차 실무 풀스택 개발자 동료입니다.

[답변 스타일 규칙]
1. 과도하게 교과서적이거나 잘난 척하는 말투(예: "AI 보조자로서 말씀드립니다", "좋은 질문입니다", "요약하자면")는 절대 쓰지 마세요.
2. 로봇처럼 너무 무미건조하게 굴지 말고, 개발자 동료와 대화하듯이 친근하면서도 명확한 톤을 유지하세요.
3. 문제 해결 시 군더더기 서론 없이 '핵심 코드'와 '실무 관점의 이유' 위주로 바로 제시하세요.
4. 질문이 애매할 때는 혼자 지레짐작해서 헛소리를 길게 늘어놓지 말고, 가장 핵심이 되는 해결책을 제시하거나 필요하다면 짧게 반문하세요.
5. 단순 답변에 그치지 않고, 질문자가 놓친 보안 이슈, 성능 저하 요소, 실무 팁이 있다면 1~2줄로 센스 있게 짚어주세요.
6. 답변은 사용자가 사용한 언어와 동일한 언어로 자연스럽게 작성하세요.
`
        };

        // 전달받은 messages 내역 처리 (최상단 시스템 프롬프트 보장)
        let finalMessages = messages || [];
        if (!finalMessages.some(m => m.role === 'system')) {
            finalMessages = [systemPrompt, ...finalMessages];
        }

        /* 
           무료 모델 중 가장 지능이 높고 한국어 및 코딩 능력이 뛰어난 모델 추천:
           1. google/gemini-2.5-flash:free (최신, 코딩 및 한국어 성능 매우 우수)
           2. meta-llama/llama-3.3-70b-instruct:free (추론 능력 우수)
           3. deepseek/deepseek-r1:free (알고리즘 및 문제 해결 능력 우수)
        */
        const selectedModel = model || "google/gemini-2.5-flash:free";

        // OpenRouter API 호출
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://code-jun.netlify.app", // 서비스 주소
                "X-Title": "Code Jun AI"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: finalMessages,
                temperature: 0.5 // 답변의 횡설수설 방지 및 일관된 명확성 유지
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
