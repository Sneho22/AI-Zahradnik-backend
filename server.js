const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({
  limit: "1mb",
}));

app.get("/", (req, res) => {
  res.send("AI Zahradník backend běží 🌿");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({
        reply: "Chybí zpráva.",
      });
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 25000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
Jsi profesionální český zahradník.

Odpovídej:
- česky
- stručně
- prakticky
- přehledně

Dotaz:
${userMessage}
                  `,
                },
              ],
            },
          ],
        }),

        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.text();

      console.log(errorData);

      return res.status(500).json({
        reply:
          "AI server momentálně neodpovídá.",
      });
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        reply:
          "AI nevygenerovala odpověď.",
      });
    }

    res.json({
      reply: text,
    });

  } catch (error) {
    console.log(error);

    if (error.name === "AbortError") {
      return res.status(408).json({
        reply:
          "Server odpovídal příliš dlouho.",
      });
    }

    res.status(500).json({
      reply:
        "Došlo k chybě serveru.",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server běží na portu ${PORT}`
  );
});