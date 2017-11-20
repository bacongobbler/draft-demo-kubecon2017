FROM python:2

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "-c", "gunicorn.py", "uuid-generator:app"]
