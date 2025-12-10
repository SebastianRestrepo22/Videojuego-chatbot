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
    function addMessage(sender, text) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${sender}`;

      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = sender === 'bot' ? '🤖' : '👤';

      const content = document.createElement('div');
      content.className = 'message-content';
      content.innerHTML = escapeHtml(text); // Seguro contra XSS

      messageDiv.appendChild(sender === 'bot' ? avatar : content);
      messageDiv.appendChild(sender === 'bot' ? content : avatar);

      chatBox.appendChild(messageDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
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