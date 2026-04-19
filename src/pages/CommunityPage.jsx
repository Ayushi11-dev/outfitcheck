import { useState } from "react";

const users = [
  { id: 1, name: "Ananya S.", handle: "@ananya", avatar: "https://i.pravatar.cc/60?img=47", style: "Minimalist", followers: 284 },
  { id: 2, name: "Priya R.", handle: "@priya.fits", avatar: "https://i.pravatar.cc/60?img=44", style: "Boho", followers: 512 },
  { id: 3, name: "Meera K.", handle: "@meera", avatar: "https://i.pravatar.cc/60?img=48", style: "Streetwear", followers: 198 },
  { id: 4, name: "Zara A.", handle: "@zarastyle", avatar: "https://i.pravatar.cc/60?img=45", style: "Formal", followers: 743 },
];

const initialMessages = [
  { id: 1, from: "bot", text: "Hey! I'm your AI stylist 👗 Ask me anything about outfits, colors, occasions or trends!" },
];

export default function CommunityPage() {
  const [followed, setFollowed] = useState([]);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const toggleFollow = (id) =>
    setFollowed(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id]);

  const botReplies = [
    "Great question! For a casual day out, try pairing neutral tones with one statement piece.",
    "I'd suggest a monochromatic look — it's effortlessly chic and always works!",
    "For your body type, A-line silhouettes and high-waist bottoms work beautifully.",
    "The trending colors this season are sage green, terracotta, and dusty rose 🌸",
    "Layering is key! A light cardigan or blazer can elevate any basic outfit instantly.",
  ];

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), from: "user", text: input };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, {
        id: Date.now() + 1,
        from: "bot",
        text: botReplies[Math.floor(Math.random() * botReplies.length)]
      }]);
      setTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">

      {/* Community Users */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#28251d]">Style Community</h2>
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-[#ece9e4] p-4 flex items-center gap-4">
              <img src={u.avatar} alt={u.name} className="w-11 h-11 rounded-full object-cover border border-[#dcd9d5]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#28251d]">{u.name}</p>
                <p className="text-xs text-[#7a7974]">{u.handle} · {u.style}</p>
                <p className="text-xs text-[#bab9b4]">{u.followers} followers</p>
              </div>
              <button
                onClick={() => toggleFollow(u.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                  ${followed.includes(u.id)
                    ? "bg-[#f3f0ec] text-[#7a7974]"
                    : "bg-[#01696f] text-white hover:bg-[#0c4e54]"
                  }`}
              >
                {followed.includes(u.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Stylist Chat */}
      <div className="bg-white rounded-2xl border border-[#ece9e4] flex flex-col h-[520px]">
        <div className="px-4 py-4 border-b border-[#ece9e4] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#e8f4f4] flex items-center justify-center text-lg">✨</div>
          <div>
            <p className="text-sm font-semibold text-[#28251d]">AI Stylist</p>
            <p className="text-xs text-[#01696f]">● Online</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${msg.from === "user"
                  ? "bg-[#01696f] text-white rounded-br-sm"
                  : "bg-[#f3f0ec] text-[#28251d] rounded-bl-sm"
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-[#f3f0ec] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#7a7974] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}/>
                <span className="w-1.5 h-1.5 bg-[#7a7974] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}/>
                <span className="w-1.5 h-1.5 bg-[#7a7974] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}/>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[#ece9e4] flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Ask your stylist..."
            className="flex-1 text-sm bg-[#f7f6f2] border border-[#dcd9d5] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#01696f] transition-colors"
          />
          <button onClick={sendMessage}
            className="px-4 py-2.5 bg-[#01696f] text-white rounded-xl text-sm hover:bg-[#0c4e54] transition-all">
            Send
          </button>
        </div>
      </div>

    </div>
  );
}