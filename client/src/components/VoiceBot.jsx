import React, { useState, useRef } from "react";
import { sendMessageToBot } from "../services/api";
import "./VoiceBot.css";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false;
  recognition.lang = "en-IN";
  recognition.interimResults = false;
}

function VoiceBot() {
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [botText, setBotText] = useState("");
  const [loading, setLoading] = useState(false);
  // const utteranceRef = useRef(null);
  React.useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  // const synthRef = useRef(window.speechSynthesis);
  const isRecognizingRef = useRef(false);

  const speak = (text) => {
    if (!window.speechSynthesis) return;

    const synth = window.speechSynthesis;

    // clear any previous queued speech (removes lag)
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = synth.getVoices();

    // ✅ force clean female voice
    utterance.voice =
      voices.find((v) => v.name.includes("Google UK English Female")) ||
      voices.find((v) => v.name.includes("Zira")) || // Windows female fallback
      voices.find((v) => v.name.includes("Female")) ||
      voices[0];

    // ✅ natural human pacing
    utterance.lang = "en-GB";
    utterance.rate = 1.05; // slightly faster, not rushed
    utterance.pitch = 1.1; // lighter tone (less heavy)
    utterance.volume = 1;

    utterance.onstart = () => {};
utterance.onend = () => {};
utterance.onerror = () => {};


    synth.speak(utterance);
  };

  const startListening = () => {
    if (!recognition) {
      alert("Speech Recognition not supported in this browser");
      return;
    }

    // 🚫 Prevent multiple starts
    if (isRecognizingRef.current) {
      return;
    }

    setListening(true);
    isRecognizingRef.current = true;

    recognition.start();

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setUserText(transcript);
      setListening(false);
      setLoading(true);

      try {
        const reply = await sendMessageToBot(transcript);
        setBotText(reply);
        speak(reply);
      } catch (err) {
        setBotText("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
    };

    recognition.onerror = () => {
      isRecognizingRef.current = false;
      setListening(false);
      alert("Voice recognition error. Try again.");
    };
  };

  return (
    <div className="app">
      <div className="card">
        <h1 className="title">🎙️ Vinay AI VoiceBot</h1>
        <p className="subtitle">
          Ask me anything about my life, skills, or growth journey
        </p>

        <div className="chat">
          {userText && <div className="bubble user">{userText}</div>}

          {loading && <div className="thinking">Thinking...</div>}

          {botText && <div className="bubble bot">{botText}</div>}
        </div>

        <button
          className={`mic ${listening ? "active" : ""}`}
          onClick={startListening}
          disabled={loading}
        >
          {listening ? "Listening..." : "🎤 Tap to Speak"}
        </button>
      </div>
    </div>
  );
}

export default VoiceBot;
