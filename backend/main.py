from fastapi import FastAPI

app = FastAPI(title="NER-LOGIX Backend")


@app.get("/")
def home():
    return {
        "project": "NER-LOGIX",
        "status": "Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "OK"
    }