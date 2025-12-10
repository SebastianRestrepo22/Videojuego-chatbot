// app.js
// Este archivo contiene la lógica principal de la aplicación web.
// Aquí se manejan las interacciones del usuario y la comunicación con el backend.

const form = document.getElementById("chat-form");
const input = document.getElementById("message");
const chatBox = document.getElementById("chat-box");

let history = [];

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  // Mostrar mensaje del usuario
  chatBox.innerHTML += `<div><strong>Tú:</strong> ${text}</div>`;

  // Enviar al backend
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, history })
  });

  const data = await res.json();

  if (data.success) {
    chatBox.innerHTML += `<div><strong>Bot:</strong> ${data.response}</div>`;

    // Actualizar historial
    history.push({ sender: "Usuario", text });
    history.push({ sender: "Bot", text: data.response });
  } else {
    chatBox.innerHTML += `<div style="color:red;">Error: ${data.error}</div>`;
  }

  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;
});
