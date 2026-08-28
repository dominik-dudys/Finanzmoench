# Datenbank — Setup

MySQL 8 läuft in einem Docker-Container. Lokal muss kein MySQL installiert werden.

## Voraussetzungen

- Docker Desktop (läuft und ist gestartet)

## Einrichten

Im Repo-Root:

```bash
# 1. .env anlegen
cp .env.example .env
```

Dann in der `.env` die beiden Passwörter setzen:

```
DB_NAME=finanzmoench
DB_USER=finanzmoench
DB_PASSWORD=devpassword
DB_ROOT_PASSWORD=rootpassword
DB_HOST=127.0.0.1
DB_PORT=3306
```

`DB_HOST` muss `127.0.0.1` sein, nicht `localhost` — sonst sucht der MySQL-Treiber einen Unix-Socket, den es hier nicht gibt.

```bash
# 2. Container starten
docker compose up -d

# 3. Status prüfen — muss "running" zeigen
docker compose ps

# 4. Tabellen anlegen
cd backend
source .venv/bin/activate
python manage.py migrate

# 5. Admin-Zugang anlegen
python manage.py createsuperuser
```

Beim allerersten Start braucht MySQL rund 20 Sekunden, bis es Verbindungen annimmt. Bricht `migrate` mit „Can't connect" ab: kurz warten, nochmal ausführen.

## Täglich

Der Container startet nach einem Neustart des Rechners nicht von selbst:

```bash
docker compose up -d
```

Muss laufen, bevor `python manage.py runserver` gestartet wird.

Stoppen:

```bash
docker compose stop
```

## Prüfen, ob alles läuft

```bash
cd backend
python manage.py shell -c "
from django.db import connection
print('Engine:', connection.vendor)
print('Datenbank:', connection.settings_dict['NAME'])
cur = connection.cursor()
cur.execute('SELECT VERSION()')
print('Server:', cur.fetchone()[0])
"
```

Erwartet: `Engine: mysql`, `Datenbank: finanzmoench`, `Server: 8.x.x`

## In die Datenbank schauen

Über den Container (dort ist der MySQL-Client installiert):

```bash
docker compose exec db mysql -u finanzmoench -p finanzmoench
```

Passwort aus der `.env`. Dann z. B. `SHOW TABLES;`, verlassen mit `exit`.

Alternativ über den Datenbank-Tab in IntelliJ Ultimate: Host `127.0.0.1`, Port `3306`, Datenbank `finanzmoench`, Zugangsdaten aus der `.env`.

`python manage.py dbshell` funktioniert nur, wenn lokal `mysql-client` installiert ist — wird nicht gebraucht.

## Daten

Die Daten liegen im Docker-Volume `mysqldata` und überleben `docker compose down`.

Datenbank komplett zurücksetzen:

```bash
docker compose down -v      # -v löscht das Volume mit allen Daten
docker compose up -d
cd backend && python manage.py migrate && python manage.py createsuperuser
```

## Nach einem `git pull`

Wenn jemand Migrations hinzugefügt hat:

```bash
docker compose up -d
cd backend && python manage.py migrate
```

## Häufige Probleme

**`Can't connect to MySQL server on '127.0.0.1'`**
Container läuft nicht. `docker compose up -d`, dann `docker compose ps` prüfen.

**`Access denied for user`**
Die Zugangsdaten in der `.env` weichen von denen ab, mit denen der Container gebaut wurde. Volume löschen und neu aufsetzen: `docker compose down -v && docker compose up -d`.

**`AttributeError: 'NoneType' object has no attribute 'startswith'`**
Die `.env` wird nicht gefunden — `os.getenv` liefert `None`. Prüfen, ob sie im Repo-Root liegt und ob in `config/settings.py` oben steht:
```python
import os
from dotenv import load_dotenv
load_dotenv(BASE_DIR.parent / ".env")
```

**Port 3306 ist belegt**
Es läuft schon ein lokales MySQL. Entweder stoppen (`brew services stop mysql`) oder in `docker-compose.yml` und `.env` auf einen anderen Port wechseln, z. B. `3307:3306`.