"""agente.app

Aplicación Flask mínima que expone dos rutas:
 - GET  /         -> sirve la plantilla `index.html`.
 - POST /api/chat -> API para enviar mensajes al agente y obtener la respuesta.

Buenas prácticas aplicadas en este archivo:
 - Docstrings en módulo y funciones.
 - Configuración básica de `logging` para llevar trazas en consola.
 - Validación del payload JSON y manejo de errores controlado (sin filtrar detalles al cliente).
 - Comentarios concisos junto a bloques lógicos para ayudar a un aprendiz.

Ejecutar en desarrollo:
  python app.py

Nota: no usar `debug=True` en producción.
"""

from typing import Any, Dict, List
import logging

from flask import Flask, render_template, request, jsonify

from model.agente import generate_response


# Configuración básica de logging: muestra la hora, nivel y mensaje.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s - %(message)s'
)

app = Flask(__name__)


@app.route('/')
def index() -> str:
    """Renderiza la página principal.

    Retorna la plantilla `index.html` ubicada en la carpeta `templates/`.
    """
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint API para conversar con el agente.

    Request JSON esperado:
      {
          "message": "texto del usuario",
          "history": [ ... ]  # opcional
      }

    Respuesta JSON de éxito:
      { "success": True, "response": "texto del asistente", "history": [...] }

    Este handler realiza validaciones básicas del payload, llama a
    `generate_response` y devuelve una respuesta JSON. Los errores se registran
    en los logs del servidor y al cliente se le devuelve un mensaje genérico
    (para no exponer detalles sensibles en producción).
    """

    try:
        # Obtener el JSON de la petición de forma silenciosa: si no es JSON, devuelve None.
        data: Dict[str, Any] | None = request.get_json(silent=True)

        if data is None:
            app.logger.warning('Payload JSON inválido o ausente')
            return jsonify({'success': False, 'error': 'Payload JSON inválido'}), 400

        # Normalizar y validar entrada
        user_message: str = str(data.get('message', '')).strip()
        history: List[Any] = data.get('history', []) or []

        if not user_message:
            return jsonify({'success': False, 'error': 'Message cannot be empty'}), 400

        # Llamada al módulo que encapsula la lógica del agente (modelo generativo)
        assistant_message: str = generate_response(user_message, history)

        # Responder con la salida del asistente. Nota: el frontend actualmente
        # mantiene el historial; si se desea, se puede agregar la respuesta
        # al `history` aquí antes de retornarla.
        return jsonify({
            'success': True,
            'response': assistant_message,
            'history': history
        }), 200

    except Exception:
        # Registrar la excepción completa en el log para facilitar depuración
        app.logger.exception('Error al procesar /api/chat')

        # Devolver un mensaje genérico al cliente (sin detalles de la excepción).
        return jsonify({
            'success': False,
            'error': 'Error al procesar tu consulta. Por favor, intenta nuevamente.'
        }), 500


if __name__ == '__main__':
    # En desarrollo ejecutamos el servidor integrado de Flask.
    # `debug=True` habilita recarga automática y debugger interactivo; evitar en producción.
    app.run(debug=True, port=5000)