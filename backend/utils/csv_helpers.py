"""Shared CSV generation utilities."""

import csv
import io
from datetime import datetime

UTF8_BOM = "\ufeff"


def generate_csv(rows: list, columns: list[str]) -> io.StringIO:
    """Generate CSV content from rows and column names with UTF-8 BOM."""
    output = io.StringIO()
    output.write(UTF8_BOM)
    writer = csv.writer(output)
    writer.writerow(columns)
    for row in rows:
        writer.writerow([row.get(col) for col in columns])
    output.seek(0)
    return output


def get_csv_filename(prefix: str) -> str:
    """Generate filename with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.csv"
