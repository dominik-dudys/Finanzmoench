from .settings import *  # noqa: F401,F403

DEBUG = True

# IMMEDIATE + WAL damit mehrere Playwright-Worker parallel schreiben können ohne db zu locken
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "e2e.sqlite3",
        "OPTIONS": {
            "timeout": 30,
            "transaction_mode": "IMMEDIATE",
            "init_command": "PRAGMA journal_mode=WAL;",
        },
    }
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "127.0.0.1"
EMAIL_PORT = 1025
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False
EMAIL_HOST_USER = ""
EMAIL_HOST_PASSWORD = ""
DEFAULT_FROM_EMAIL = "noreply@finanzmoench.test"

ACCOUNT_RATE_LIMITS = False
ACCOUNT_REAUTHENTICATION_TIMEOUT = 60 * 60 * 8

STRIPE_SECRET_KEY = "sk_test_e2e"
STRIPE_WEBHOOK_SECRET = "whsec_e2e"
STRIPE_PRICE_ID_PREMIUM = "price_e2e"
