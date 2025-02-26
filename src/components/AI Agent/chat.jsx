import React, { useState } from "react";

function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5050/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer);
      setHistory((prev) => [...prev, { question, answer: data.answer }]);
      setQuestion("");
    } catch (err) {
      console.error(err);
      setAnswer("Đã xảy ra lỗi.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1>Hỏi - Đáp với Haystack</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
        />
        <button type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Gửi"}
        </button>
      </form>
      {answer && (
        <div>
          <strong>Câu trả lời:</strong> {answer}
        </div>
      )}

      <div>
        <h2>Lịch sử hội thoại</h2>
        {history.map((item, idx) => (
          <div key={idx}>
            <p>
              <strong>Q:</strong> {item.question}
            </p>
            <p>
              <strong>A:</strong> {item.answer}
            </p>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Chat;
