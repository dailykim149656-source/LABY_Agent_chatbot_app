import os
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv("backend/azure_and_sql.env")

from .routers import health, accidents, logs, chat, safety, experiments, reagents, monitoring, chat_rooms, speech, export, auth, users, consents
from .services.agent_service import init_app_state
from .utils.dependencies import csrf_protect, get_current_user


def create_app() -> FastAPI:
    app = FastAPI(title="Smart Lab Backend", version="0.1.0")

    cors_origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
    cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    if not cors_origins:
        cors_origins = ["http://localhost:3000"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        app_env = os.getenv("APP_ENV", "development").lower()
        default_csp = "default-src 'none'; frame-ancestors 'none'; base-uri 'none';"
        if app_env == "production":
            csp = (
                os.getenv("CSP_POLICY_PROD")
                or os.getenv("CSP_POLICY")
                or default_csp
            )
        else:
            csp = (
                os.getenv("CSP_POLICY_DEV")
                or os.getenv("CSP_POLICY")
                or default_csp
            )
        response.headers["Content-Security-Policy"] = csp

        if request.url.scheme == "https" or os.getenv("ENABLE_HSTS") == "1":
            hsts = "max-age=63072000; includeSubDomains"
            if os.getenv("HSTS_PRELOAD") == "1":
                hsts = f"{hsts}; preload"
            response.headers["Strict-Transport-Security"] = hsts
        return response

    @app.on_event("startup")
    def on_startup() -> None:
        init_app_state(app)

    protected = [Depends(get_current_user), Depends(csrf_protect)]

    app.include_router(auth.router)
    app.include_router(health.router, dependencies=protected)
    app.include_router(accidents.router, dependencies=protected)
    app.include_router(logs.router, dependencies=protected)
    app.include_router(chat.router, dependencies=protected)
    app.include_router(chat_rooms.router, dependencies=protected)
    app.include_router(safety.router, dependencies=protected)
    app.include_router(experiments.router, dependencies=protected)
    app.include_router(reagents.router, dependencies=protected)
    app.include_router(monitoring.router, dependencies=protected)
    app.include_router(speech.router, dependencies=protected)
    app.include_router(export.router, dependencies=protected)
    app.include_router(users.router)
    app.include_router(consents.router)

    return app


app = create_app()
