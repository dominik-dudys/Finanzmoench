from django.shortcuts import render

# Create your views here.
import stripe
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

stripe.api_key = settings.STRIPE_SECRET_KEY

@csrf_exempt
def create_checkout_session(request):
    if request.method == 'POST':
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card', 'paypal'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur', # maybe make this flexible after
                        'product_data': {
                            'name': 'Mein tolles Produkt',
                        },
                        'unit_amount': 2000,# ammoun in cent
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/cancel',
            )

            return JsonResponse({'url': session.url})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=403)

    return JsonResponse({'error': 'Nur POST-Requests erlaubt'}, status=405)




@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # TODO
        print("Zahlung war erfolgreich für Session:", session.get('id'))

    return HttpResponse(status=200)