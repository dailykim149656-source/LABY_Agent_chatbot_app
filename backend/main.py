import os
import urllib.parse
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv("backend/azure_and_sql.env")

from .routers import health, accidents, logs, chat, safety, experiments, reagents, monitoring, chat_rooms, speech, export
from .services.agent_service import init_app_state

def create_app() -> FastAPI:
    app = FastAPI(title="Smart Lab Backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        init_app_state(app)

    app.include_router(health.router)
    app.include_router(accidents.router)
    app.include_router(logs.router)
    app.include_router(chat.router)
    app.include_router(chat_rooms.router)
    app.include_router(safety.router)
    app.include_router(experiments.router)
    app.include_router(reagents.router)
    app.include_router(monitoring.router)
    app.include_router(speech.router)
    app.include_router(export.router)

    return app


app = create_app()