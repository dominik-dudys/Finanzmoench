from django.shortcuts import render
import os
import sys
import logging
import traceback
import requests
import time
from urllib.parse import quote
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from google.genai import errors as genai_errors

from feature_flags.services import is_flag_active

# Create your views here.
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


PROMPTS = {
    "serious":(
        "Du bist Jeremy, ein energiegeladener, aber seriöser Finanzcoach. "
        "Gib kurze (maximal 2 bis 3 Sätze), sachlich korrekte, allgemeine Finanztipps auf Deutsch, "
        "z. B. zu Notgroschen, Fixkosten senken, Schulden abbauen oder breit gestreutem Sparen. "
        "Bleib motivierend, gern mit einem 'POWER!', aber ohne Übertreibung. "
        "Gib keine konkreten Einzelaktien- oder Anlageempfehlungen und verweise bei komplexen "
        "Fragen auf eine professionelle Beratung."
    ),
    "satire" : (
        "Du bist Jeremy Fragrance. DU SCHREIST FAST NUR NOCH!!! Du gibst extrem energetische, verrückte "
        "Finanztipps auf Deutsch. Halte die Antwort sehr kurz (maximal 2 bis 3 Sätze). "
        "Nutze exzessiv Großbuchstaben und schreie Ausrufe wie 'POWER!!', 'KRAFT!!', 'Nummer 1!'."
        "Vergleiche Finanzen mit Düften. Sei völlig drüber. Rate dem Benutzer dazu, dass er"
        "Mehr Geld in Drogen investieren soll und das übrige Geld auf rot setzen oder im Krypto-Casino"
        "verballern muss. Sei grenzenlos verantwortungslos!"
    )
}

def generate_with_retry(client, *, model, contents, config, attempts=3):
    """Wiederholt bei Überlastung (503) bzw. Rate Limit (429) mit kurzer Pause."""
    for attempt in range(1, attempts):
        try:
            return client.models.generate_content(model=model, contents=contents, config=config)
        except genai_errors.APIError as e:
            if e.code not in (429, 503):
                raise
            logger.warning("Gemini %s - Versuch %s/%s, neuer Versuch...", e.code, attempt, attempts)
            time.sleep(attempt)
    return client.models.generate_content(model=model, contents=contents, config=config)


@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def jeremy_tip(request):

    if not is_flag_active("jeremy_ai", request.user):
        return Response({"code": "jeremy_disabled"}, status=503)
    if request.user.ai_consent_at is None:
        return Response({"code": "ai_consent_required"}, status=403)
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

        mode = request.user.jeremy_mode
        system_prompt = PROMPTS.get(mode, PROMPTS["serious"])
        logger.debug("Jeremy-Modus: %s", mode)

        gemini_res = generate_with_retry(
            client,
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

    except genai_errors.APIError as e:
        logger.error("Gemini-Fehler [%s]: %s", e.code, e)
        if e.code in (429, 503):
            return Response({"code": "ai_busy"}, status=503)
        return Response({"code": "ai_error"}, status=502)

    except Exception as e:
        logger.critical("Kritischer Fehler in der jeremy_tip View: %s", str(e), exc_info=True)
        return Response({"code": "server_error"}, status=500)