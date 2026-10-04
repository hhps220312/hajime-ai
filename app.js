import { GoogleGenAI } from '@google/genai';

let ai; // AIの準備用変数

// 画面の要素を取得
const apiKeyArea = document.getElementById('api-key-area');
const chatArea = document.getElementById('chat-area');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');

// --- 1. APIキーの設定処理 ---
// ブラウザに保存されたキーがすでにあるか確認
const savedKey = localStorage.getItem('my_gemini_api_key');
if (savedKey) {
    initAI(savedKey);
}

// 保存ボタンを押したときの処理
saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('my_gemini_api_key', key); // ブラウザに安全に保存
        initAI(key);
    }
});

// AIを起動する関数
function initAI(key) {
    ai = new GoogleGenAI({ apiKey: key });
    apiKeyArea.style.display = 'none'; // キー入力欄を隠す
    chatArea.style.display = 'block';  // チャット画面を出す
}

// --- 2. 音声入力の設定 (Web Speech API) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
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
        micBtn.textContent = "🎤 音声";
        micBtn.classList.remove('listening');
    };
    
    recognition.onerror = () => {
        micBtn.textContent = "🎤 音声";
        micBtn.classList.remove('listening');
    };
} else {
    micBtn.style.display = 'none'; // ブラウザが音声入力非対応の場合はボタンを隠す
}

// --- 3. AIとの通信 ---
async function generateAIResponse(text) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
        });
        return response.text;
    } catch (error) {
        console.error(error);
        // エラーが出た場合はAPIキーをリセットして再入力を促す
        localStorage.removeItem('my_gemini_api_key');
        apiKeyArea.style.display = 'block';
        chatArea.style.display = 'none';
        return "エラーが発生しました。APIキーが間違っている可能性があります。もう一度設定してください。";
    }
}

// 画面にメッセージを表示
function addMessageToChat(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-msg' : 'ai-msg');
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // 一番下にスクロール
}

// 送信ボタンの処理
sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if (!text) return;

    addMessageToChat(text, 'user');
    userInput.value = '';

    const loadingId = Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = `loading-${loadingId}`;
    loadingDiv.classList.add('message', 'ai-msg');
    loadingDiv.textContent = "考え中...";
    chatBox.appendChild(loadingDiv);

    const aiResponseText = await generateAIResponse(text);

    document.getElementById(`loading-${loadingId}`).remove();
    addMessageToChat(aiResponseText, 'ai');
});

// Enterキーでも送信できるようにする
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});
