
import csv

from django.http import HttpResponse
from django.utils import timezone


def csv_response(filename_prefix, header, rows):
    """CSV-Download, der in Excel (DE) direkt mit Umlauten und Spalten aufgeht."""
    stamp = timezone.localtime().strftime("%Y-%m-%d_%H-%M")
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename_prefix}_{stamp}.csv"'
    response.write("\ufeff")  # BOM → Excel erkennt UTF-8 (ä, ö, ü)
    writer = csv.writer(response, delimiter=";")  # Semikolon → deutsches Excel trennt Spalten richtig
    writer.writerow(header)
    writer.writerows(rows)
    return response