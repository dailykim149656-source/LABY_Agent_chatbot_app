from sqlalchemy import create_engine
from langchain_community.utilities import SQLDatabase

from .. import sql_agent as agent_module


def init_app_state(app) -> None:
    agent_module.load_environment()

    engine = create_engine(agent_module.get_connection_string())
    agent_module.init_db_schema(engine)
    agent_module.db_engine = engine

    db = SQLDatabase(engine)
    llm = agent_module.get_azure_openai_llm()
    agent_executor = agent_module.create_conversational_agent(llm, db)

    app.state.db_engine = engine
    app.state.agent_executor = agent_executor
