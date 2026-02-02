from sqlalchemy import create_engine
from langchain_community.utilities import SQLDatabase

from .. import sql_agent as agent_module
from .translation_service import TranslationService


def init_app_state(app) -> None:
    agent_module.load_environment()

    engine = create_engine(
        agent_module.get_connection_string(),
        pool_pre_ping=True,  # 쿼리 전 연결 유효성 검사
        pool_recycle=1800,   # 30분마다 연결 재생성 (Azure SQL 타임아웃 대응)
    )
    agent_module.init_db_schema(engine)
    agent_module.db_engine = engine

    db = SQLDatabase(engine)
    llm = agent_module.get_azure_openai_llm()
    agent_executor = agent_module.create_conversational_agent(llm, db)

    app.state.db_engine = engine
    app.state.agent_executor = agent_executor
    app.state.translation_service = TranslationService(engine)
