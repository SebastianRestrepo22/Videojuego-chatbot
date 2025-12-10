// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const form = document.getElementById("chat-form");
const input = document.getElementById("message");
const chatBox = document.getElementById("chat-box");

let history = [];

// Función para agregar mensaje al chat
// Función para agregar mensaje al chat
function addMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = sender === 'bot' ? '🤖' : '👤';

  const content = document.createElement('div');
  content.className = 'message-content';

  if (sender === 'bot') {
    // Convertir Markdown a HTML
    content.innerHTML = markdownToHtml(text);
  } else {
    // Usuario: texto plano seguro (escapar HTML)
    content.textContent = text;
  }

  // Organizar el orden de los elementos según quien envía
  if (sender === 'bot') {
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
  } else {
    messageDiv.appendChild(content);
    messageDiv.appendChild(avatar);
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Función para convertir Markdown básico a HTML
function markdownToHtml(text) {
  return text
    // Títulos
    .replace(/###\s+(.*?)(\n|$)/g, '<h3>$1</h3>')
    // Negritas
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Listas
    .replace(/^\*\s+(.*?)(\n|$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)+/gs, '<ul>$&</ul>')
    // Párrafos y saltos de línea
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/g, '<p>')
    .replace(/$/g, '</p>')
    .replace(/<p><\/p>/g, '');
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  // Mostrar mensaje del usuario
  addMessage('user', text);

  // Limpiar y deshabilitar input temporalmente
  input.value = '';
  input.disabled = true;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Enviando...';

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history })
    });

    if (!res.ok) throw new Error("Error de red");

    const data = await res.json();

    if (data.success) {
      addMessage('bot', data.response);
      history.push({ sender: "Usuario", text });
      history.push({ sender: "Bot", text: data.response });
    } else {
      addMessage('bot', `Error: ${data.error || "Algo salió mal"}`);
    }
  } catch (err) {
    addMessage('bot', "No se pudo conectar con el servidor. ¿Está corriendo tu backend?");
    console.error("Error en la solicitud:", err);
  } finally {
    input.disabled = false;
    submitBtn.textContent = originalText;
    input.focus();
  }
});