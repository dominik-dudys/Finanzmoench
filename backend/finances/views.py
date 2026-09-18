from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

import os
import sys
import traceback
import requests
from urllib.parse import quote
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from google import genai
from google.genai import types

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def jeremy_tip(request):
    try:
        print("--- STARTE JEREMY API ---", file=sys.stderr)
        user_question = request.data.get("question", "Wie investiere ich mein Geld?")

        # Keys laden
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        fish_api_key = os.environ.get("FISH_API_KEY")
        voice_id = os.environ.get("FISH_VOICE_ID")

        if not gemini_api_key or not fish_api_key or not voice_id:
            print("FEHLER: Ein API Key oder die Fish Voice ID fehlt in der .env", file=sys.stderr)
            return HttpResponse("Fehler: API Keys fehlen", status=500)

        print("-> Sende Anfrage an Gemini...", file=sys.stderr)
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
        print(f"Gemini Text: {jeremy_text}", file=sys.stderr)

        print("-> Sende Anfrage an Fish Audio...", file=sys.stderr)
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
            print(f"FISH AUDIO FEHLER: {tts_response.text}", file=sys.stderr)
            return HttpResponse(f"Fish Audio Fehler: {tts_response.text}", status=500)

        print("Fish Audio erfolgreich generiert!", file=sys.stderr)

        response = HttpResponse(tts_response.content, content_type="audio/mpeg")
        response["X-Jeremy-Text"] = quote(jeremy_text)
        response["Access-Control-Expose-Headers"] = "X-Jeremy-Text"
        print("--- ENDE ERFOLGREICH ---", file=sys.stderr)

        return response

    except Exception as e:
        print(f"ABSTURZ IN DER VIEW: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return HttpResponse(f"Server Fehler: {str(e)}", status=500)

class TransactionListView(APIView):
    def get(self, request, format=None):
        dummy_data = [
            {"id": 1, "title": "Gehalt", "amount": 2500.00, "date": "2026-06-01"},
            {"id": 2, "title": "Miete", "amount": -850.00, "date": "2026-06-03"}
        ]
        return Response(dummy_data, status=status.HTTP_200_OK)