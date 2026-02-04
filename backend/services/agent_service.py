import os
from sqlalchemy import create_engine
from langchain_community.utilities import SQLDatabase

from .. import sql_agent as agent_module
from ..repositories import users_repo, refresh_tokens_repo
from ..utils.security import hash_password, validate_password_policy
from .translation_service import TranslationService


def seed_test_users(engine) -> None:
    if os.getenv("SEED_TEST_USERS") != "1":
        return

    if os.getenv("APP_ENV", "development").lower() == "production":
        return

    email = os.getenv("TEST_USER_EMAIL", "msu@msu.lab.kr")
    password = os.getenv("TEST_USER_PASSWORD", "Test1234")
    valid_password = True
    try:
        validate_password_policy(password)
    except ValueError:
        valid_password = False
    existing = users_repo.get_user_by_email(engine, email)
    if existing:
        if valid_password:
            users_repo.update_password_hash(
                engine, existing["user_id"], hash_password(password)
            )

        if existing.get("role") != "admin" or existing.get("name") != "Test Admin":
            users_repo.update_user(
                engine,
                user_id=existing["user_id"],
                name="Test Admin",
                role="admin",
                is_active=True,
            )
        return

    if not valid_password:
        return

    users_repo.create_user(
        engine,
        email=email,
        password_hash=hash_password(password),
        name="Test Admin",
        role="admin",
    )


def init_app_state(app) -> None:
    agent_module.load_environment()

    engine = create_engine(
        agent_module.get_connection_string(),
        pool_pre_ping=True,  # 쿼리 전 연결 유효성 검사
        pool_recycle=1800,   # 30분마다 연결 재생성 (Azure SQL 타임아웃 대응)
    )
    agent_module.init_db_schema(engine)
    agent_module.db_engine = engine
    refresh_tokens_repo.cleanup_refresh_tokens(engine)
    seed_test_users(engine)

    db = SQLDatabase(engine)
    llm = agent_module.get_azure_openai_llm()
    agent_executor = agent_module.create_conversational_agent(llm, db)

    app.state.db_engine = engine
    app.state.agent_executor = agent_executor
    app.state.translation_service = TranslationService(engine)
