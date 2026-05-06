from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ask_db import ask_question


app = FastAPI(title="Seoul RAG Chatbot API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    question: str


@app.get("/")
def health_check():
    return {
        "message": "Seoul RAG Chatbot API is running"
    }


@app.post("/ask")
def ask(request: QuestionRequest):
    result = ask_question(request.question)

    return result