from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import health, accidents, logs, chat, safety, experiments, reagents, monitoring
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
    app.include_router(safety.router)
    app.include_router(experiments.router)
    app.include_router(reagents.router)
    app.include_router(monitoring.router)

    return app


app = create_app()
