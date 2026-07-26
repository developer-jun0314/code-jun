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
            body: JSON.stringify({ error: 'API 키가 설정되지 않았습니다. Netlify 환경변수를 확인하세요.' }),
        };
    }

    try {
        const { model, messages } = JSON.parse(event.body || '{}');

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model || "google/gemini-2.5-flash",
                messages: messages
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: data.error?.message || "OpenRouter API 오류" }),
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
