import { GoogleGenAI } from '@google/genai';

// ★準備: Google AI Studioで取得したAPIキーをここに入れます
// 注意: GitHubに公開する際は、このキーをそのまま書くと危険なので、後でFirebaseに隠す方法を教えます。今はテスト用です。
const API_KEY = "ここにあなたのAPIキーを貼り付けます"; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');

// --- 音声入力の設定 (Web Speech API) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'ja-JP';
recognition.interimResults = false;

micBtn.addEventListener('click', () => {
    recognition.start();
    micBtn.textContent = "🎙️ 聞き取り中...";
    micBtn.classList.add('listening');
});

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    micBtn.textContent = "🎤 音声入力";
    micBtn.classList.remove('listening');
};

// --- Gemini API (AIの脳みそ) との通信 ---
async function generateAIResponse(text) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // 最新の高速・高性能モデル
            contents: text,
        });
        return response.text;
    } catch (error) {
        console.error(error);
        return "エラーが発生しました。APIキーが正しいか確認してください。";
    }
}

// --- 画面にメッセージを表示する処理 ---
function addMessageToChat(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-msg' : 'ai-msg');
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- 送信ボタンを押したときの処理 ---
sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. ユーザーの入力を画面に表示
    addMessageToChat(text, 'user');
    userInput.value = '';

    // 2. 「考え中...」と表示
    const loadingId = Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = `loading-${loadingId}`;
    loadingDiv.classList.add('message', 'ai-msg');
    loadingDiv.textContent = "考え中...";
    chatBox.appendChild(loadingDiv);

    // 3. AIにリクエストを送る
    const aiResponseText = await generateAIResponse(text);

    // 4. 「考え中...」を消して、AIの回答を表示
    document.getElementById(`loading-${loadingId}`).remove();
    addMessageToChat(aiResponseText, 'ai');
});
