from django.shortcuts import render
import os
import sys
import logging
import traceback
import requests
from urllib.parse import quote
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

# Create your views here.
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def jeremy_tip(request):
    try:
        logger.info("--- STARTE JEREMY API ---")
        user_question = request.data.get("question", "Wie investiere ich mein Geld?")
        logger.debug("Userfrage empfangen: %s", user_question)

        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        fish_api_key = os.environ.get("FISH_API_KEY")
        voice_id = os.environ.get("FISH_VOICE_ID")

        if not gemini_api_key or not fish_api_key or not voice_id:
            logger.error("Abbruch: Ein API Key oder die Fish Voice ID fehlt in der .env!")
            return HttpResponse("Fehler: API Keys fehlen", status=500)

        logger.info("Sende Anfrage an Gemini...")
        client = genai.Client(api_key=gemini_api_key)

        system_prompt = (
                    "Du bist Jeremy Fragrance. DU SCHREIST FAST NUR NOCH!!! Du gibst extrem energetische, verrückte "
                    "Finanztipps auf Deutsch. Halte die Antwort sehr kurz (maximal 2 bis 3 Sätze). "
                    "Nutze exzessiv Großbuchstaben und schreie Ausrufe wie 'POWER!!', 'KRAFT!!', 'Nummer 1!'."
                    "Vergleiche Finanzen mit Düften. Sei völlig drüber. Rate dem Benutzer dazu, dass er"
                    "Mehr Geld in Drogen investieren soll und das übrige Geld auf rot setzen oder im Krypto-Casino"
                    "verballern muss. Sei grenzenlos verantwortungslos!"
                )

        gemini_res = client.models.generate_content(
            model="gemini-3.6-flash", #möglicherweise Nutzung von 3.5 - 3.8
            contents=f"Frage: {user_question}",
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            )
        )
        jeremy_text = gemini_res.text.strip().replace("\n", " ")
        logger.debug("Gemini Antwort generiert: %s", jeremy_text)

        logger.info("Sende Text an Fish Audio für MP3-Generierung...")
        tts_url = "https://api.fish.audio/v1/tts"

        headers = {
            "Authorization": f"Bearer {fish_api_key}",
            "Content-Type": "application/json",
            "model": "s2.1-pro-free",
        }

        data = {
            "text": jeremy_text,
            "reference_id": voice_id,
            "format": "mp3"
        }

        tts_response = requests.post(tts_url, json=data, headers=headers)

        if not tts_response.ok:
            logger.error("Fish Audio API Fehler [Status %s]: %s", tts_response.status_code, tts_response.text)
            return HttpResponse(f"Fish Audio Fehler: {tts_response.text}", status=500)

        logger.info("Fish Audio MP3 erfolgreich empfangen. Sende Response an Client.")

        response = HttpResponse(tts_response.content, content_type="audio/mpeg")
        response["X-Jeremy-Text"] = quote(jeremy_text)
        response["Access-Control-Expose-Headers"] = "X-Jeremy-Text"
        logger.info("--- ENDE ERFOLGREICH ---")

        return response

    except Exception as e:
        logger.critical("Kritischer Fehler in der jeremy_tip View: %s", str(e), exc_info=True)
        return HttpResponse(f"Server Fehler: {str(e)}", status=500)