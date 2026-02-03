import os
import urllib.parse
import logging
from typing import Any, List

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate
from langchain_core.tools import tool
from sqlalchemy import create_engine, text
import sqlalchemy
from azure.monitor.opentelemetry import configure_azure_monitor
from opentelemetry.instrumentation.langchain import LangchainInstrumentor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
# Suppress noisy Azure Monitor logs
logging.getLogger("azure.core.pipeline.policies.http_logging_policy").setLevel(logging.WARNING)
logging.getLogger("azure.monitor.opentelemetry.exporter").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Global engine instance for simple tool access
db_engine = None

def load_environment() -> None:
    """Load and validate environment variables."""
    # Calculate the path relative to this script file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, "azure_and_sql.env")
    load_dotenv(dotenv_path=env_path)
    
    required_vars = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "OPENAI_API_VERSION",
        "AZURE_DEPLOYMENT_NAME",
        "SQL_SERVER",
        "SQL_DATABASE",
        "SQL_USERNAME",
        "SQL_PASSWORD"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")
    logger.info("Environment variables loaded successfully.")

def get_connection_string() -> str:
    """Constructs the connection string."""
    server = os.getenv("SQL_SERVER")
    database = os.getenv("SQL_DATABASE")
    username = os.getenv("SQL_USERNAME")
    password = os.getenv("SQL_PASSWORD")
    encoded_password = urllib.parse.quote_plus(password)
    driver = os.getenv("SQL_DRIVER", "ODBC Driver 18 for SQL Server")
    encoded_driver = urllib.parse.quote_plus(driver)
    
    return (
        f"mssql+pyodbc://{username}:{encoded_password}@{server}/{database}"
        f"?driver={encoded_driver}"
    )

def init_db_schema(engine):
    """
    Ensures the necessary Master-Detail tables exist in the database.
    """
    logger.info("Checking and initializing database schema...")
    
    # 1. Experiments (Parent)
    table_exp = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Experiments' AND xtype='U')
    CREATE TABLE Experiments (
        exp_id INT IDENTITY(1,1) PRIMARY KEY,
        exp_name NVARCHAR(100) UNIQUE NOT NULL,
        researcher NVARCHAR(50),
        status NVARCHAR(20),
        exp_date DATE,
        memo NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETUTCDATE()
    );
    """

    table_exp_add_status = """
    IF COL_LENGTH('Experiments', 'status') IS NULL
        ALTER TABLE Experiments ADD status NVARCHAR(20);
    """
    table_exp_add_exp_date = """
    IF COL_LENGTH('Experiments', 'exp_date') IS NULL
        ALTER TABLE Experiments ADD exp_date DATE;
    """
    table_exp_add_memo = """
    IF COL_LENGTH('Experiments', 'memo') IS NULL
        ALTER TABLE Experiments ADD memo NVARCHAR(MAX);
    """
    
    # 2. ExperimentData (Child)
    # User requested schema change: weight -> volume
    # Avoid destructive drop in production; allow only via explicit env flag.
    table_data_drop = "DROP TABLE IF EXISTS ExperimentData;"
    table_data_create = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExperimentData' AND xtype='U')
    CREATE TABLE ExperimentData (
        data_id INT IDENTITY(1,1) PRIMARY KEY,
        exp_id INT,
        material NVARCHAR(100),
        volume FLOAT,    -- Changed from weight to volume
        density FLOAT,
        mass FLOAT,
        recorded_at DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (exp_id) REFERENCES Experiments(exp_id)
    );
    """

    # 3. EmailLogs (Temporary table for email log feature)
    table_email_logs = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmailLogs' AND xtype='U')
    CREATE TABLE EmailLogs (
        email_id INT IDENTITY(1,1) PRIMARY KEY,
        sent_time DATETIME NOT NULL,
        recipient NVARCHAR(100) NOT NULL,
        recipient_email NVARCHAR(150) NOT NULL,
        incident_type NVARCHAR(200) NOT NULL,
        delivery_status NVARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT GETUTCDATE()
    );
    """

    # 4. ChatLogs (Conversation log table)
    table_chat_logs = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatLogs' AND xtype='U')
    CREATE TABLE ChatLogs (
        log_id INT IDENTITY(1,1) PRIMARY KEY,
        timestamp DATETIME DEFAULT GETUTCDATE(),
        user_name NVARCHAR(100) NOT NULL,
        command NVARCHAR(500) NOT NULL,
        status NVARCHAR(20) NOT NULL
    );
    """

    # 4.1 ChatRooms (Multi-room chat metadata)
    table_chat_rooms = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatRooms' AND xtype='U')
    CREATE TABLE ChatRooms (
        room_id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(200) NOT NULL,
        room_type NVARCHAR(20) NOT NULL DEFAULT 'public',
        created_by_user_id NVARCHAR(100) NULL,
        created_at DATETIME DEFAULT GETUTCDATE(),
        last_message_at DATETIME NULL,
        last_message_preview NVARCHAR(200) NULL
    );
    """

    # 4.2 ChatMessages (Multi-room chat history)
    table_chat_messages = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatMessages' AND xtype='U')
    CREATE TABLE ChatMessages (
        message_id INT IDENTITY(1,1) PRIMARY KEY,
        room_id INT NOT NULL,
        role NVARCHAR(20) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        sender_type NVARCHAR(20) NOT NULL,
        sender_id NVARCHAR(100) NULL,
        sender_name NVARCHAR(100) NULL,
        created_at DATETIME DEFAULT GETUTCDATE(),
        FOREIGN KEY (room_id) REFERENCES ChatRooms(room_id)
    );
    """

    # 5. Reagents (Inventory)
    table_reagents = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Reagents' AND xtype='U')
    CREATE TABLE Reagents (
        reagent_id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        formula NVARCHAR(50),
        purchase_date DATE,
        open_date DATE NULL,
        current_volume_value FLOAT NULL,
        current_volume_unit NVARCHAR(10) NULL,
        original_volume_value FLOAT NULL,
        original_volume_unit NVARCHAR(10) NULL,
        density FLOAT NULL,
        mass FLOAT NULL,
        purity FLOAT NULL,
        location NVARCHAR(50) NULL,
        status NVARCHAR(20) NULL,
        created_at DATETIME DEFAULT GETUTCDATE()
    );
    """

    # 6. ExperimentReagents (Usage)
    table_experiment_reagents = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExperimentReagents' AND xtype='U')
    BEGIN
        DECLARE @reagent_id_type NVARCHAR(100);
        SELECT @reagent_id_type =
            CASE
                WHEN t.name IN ('varchar','nvarchar','char','nchar') THEN
                    t.name + '(' + CASE
                        WHEN c.max_length = -1 THEN 'MAX'
                        ELSE CAST(CASE WHEN t.name IN ('nvarchar','nchar') THEN c.max_length / 2 ELSE c.max_length END AS NVARCHAR(10))
                    END + ')'
                WHEN t.name IN ('decimal','numeric') THEN
                    t.name + '(' + CAST(c.precision AS NVARCHAR(10)) + ',' + CAST(c.scale AS NVARCHAR(10)) + ')'
                ELSE t.name
            END
        FROM sys.columns c
        JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID('Reagents') AND c.name = 'reagent_id';

        IF @reagent_id_type IS NULL
            SET @reagent_id_type = 'NVARCHAR(50)';

        DECLARE @sql NVARCHAR(MAX) = N'
        CREATE TABLE ExperimentReagents (
            exp_reagent_id INT IDENTITY(1,1) PRIMARY KEY,
            exp_id INT NOT NULL,
            reagent_id ' + @reagent_id_type + ' NOT NULL,
            dosage_value FLOAT NULL,
            dosage_unit NVARCHAR(10) NULL,
            created_at DATETIME DEFAULT GETUTCDATE(),
            FOREIGN KEY (exp_id) REFERENCES Experiments(exp_id),
            FOREIGN KEY (reagent_id) REFERENCES Reagents(reagent_id)
        );';

        EXEC sp_executesql @sql;
    END;
    """

    # 7. ReagentDisposals
    table_reagent_disposals = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ReagentDisposals' AND xtype='U')
    BEGIN
        DECLARE @reagent_id_type NVARCHAR(100);
        SELECT @reagent_id_type =
            CASE
                WHEN t.name IN ('varchar','nvarchar','char','nchar') THEN
                    t.name + '(' + CASE
                        WHEN c.max_length = -1 THEN 'MAX'
                        ELSE CAST(CASE WHEN t.name IN ('nvarchar','nchar') THEN c.max_length / 2 ELSE c.max_length END AS NVARCHAR(10))
                    END + ')'
                WHEN t.name IN ('decimal','numeric') THEN
                    t.name + '(' + CAST(c.precision AS NVARCHAR(10)) + ',' + CAST(c.scale AS NVARCHAR(10)) + ')'
                ELSE t.name
            END
        FROM sys.columns c
        JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID('Reagents') AND c.name = 'reagent_id';

        IF @reagent_id_type IS NULL
            SET @reagent_id_type = 'NVARCHAR(50)';

        DECLARE @sql NVARCHAR(MAX) = N'
        CREATE TABLE ReagentDisposals (
            disposal_id INT IDENTITY(1,1) PRIMARY KEY,
            reagent_id ' + @reagent_id_type + ' NOT NULL,
            disposal_date DATE NOT NULL,
            reason NVARCHAR(100) NOT NULL,
            disposed_by NVARCHAR(50) NOT NULL,
            created_at DATETIME DEFAULT GETUTCDATE(),
            FOREIGN KEY (reagent_id) REFERENCES Reagents(reagent_id)
        );';

        EXEC sp_executesql @sql;
    END;
    """

    # 8. StorageEnvironment (Environment Sensors)
    table_storage_environment = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StorageEnvironment' AND xtype='U')
    CREATE TABLE StorageEnvironment (
        env_id INT IDENTITY(1,1) PRIMARY KEY,
        location NVARCHAR(50) NOT NULL,
        temp FLOAT NULL,
        humidity FLOAT NULL,
        status NVARCHAR(20) NULL,
        recorded_at DATETIME DEFAULT GETUTCDATE()
    );
    """

    # 9. WeightLog (Arduino Scale Data)
    # Stores real-time weight measurements and occupancy status.
    table_weight_log = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WeightLog' AND xtype='U')
    CREATE TABLE WeightLog (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        StorageID NVARCHAR(50) NOT NULL, -- e.g., 'Alpha'
        WeightValue FLOAT NOT NULL,      -- in grams
        Status NVARCHAR(20) NOT NULL,    -- 'Empty' or 'Occupied'
        EmptyTime INT DEFAULT 0,         -- Duration in seconds
        RecordedAt DATETIME DEFAULT GETUTCDATE()
    );
    """

    # 10. TranslationCache (i18n cache)
    table_translation_cache = """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TranslationCache' AND xtype='U')
    CREATE TABLE TranslationCache (
        cache_id INT IDENTITY(1,1) PRIMARY KEY,
        source_hash NVARCHAR(64) NOT NULL,
        source_lang NVARCHAR(10) NULL,
        target_lang NVARCHAR(10) NOT NULL,
        provider NVARCHAR(50) NOT NULL,
        translated_text NVARCHAR(MAX) NOT NULL,
        created_at DATETIME DEFAULT GETUTCDATE(),
        last_accessed_at DATETIME NULL,
        hit_count INT DEFAULT 0,
        expires_at DATETIME NULL
    );
    """

    table_translation_cache_index = """
    IF NOT EXISTS (
        SELECT * FROM sys.indexes
        WHERE name = 'IX_TranslationCache_Lookup'
          AND object_id = OBJECT_ID('TranslationCache')
    )
    CREATE INDEX IX_TranslationCache_Lookup
    ON TranslationCache (source_hash, source_lang, target_lang, provider);
    """

    
    try:
        with engine.connect() as conn:
            # Experiments table logic remains (Create if not exists)
            conn.execute(text(table_exp))
            conn.execute(text(table_exp_add_status))
            conn.execute(text(table_exp_add_exp_date))
            conn.execute(text(table_exp_add_memo))
            
            # ExperimentData table logic (Create if not exists).
            # If RESET_EXPERIMENTDATA=1, drop and recreate.
            if os.getenv("RESET_EXPERIMENTDATA", "0") == "1":
                logger.warning("RESET_EXPERIMENTDATA=1 set. Dropping and recreating ExperimentData.")
                conn.execute(text(table_data_drop))
                conn.execute(text(table_data_create))
            else:
                conn.execute(text(table_data_create))

            # EmailLogs table logic (Create if not exists)
            conn.execute(text(table_email_logs))

            # ChatLogs table logic (Create if not exists)
            conn.execute(text(table_chat_logs))
            conn.execute(text(table_chat_rooms))
            conn.execute(text(table_chat_messages))

            # Reagents and related tables
            conn.execute(text(table_reagents))
            conn.execute(text(table_experiment_reagents))
            conn.execute(text(table_reagent_disposals))
            conn.execute(text(table_storage_environment))
            conn.execute(text(table_weight_log))
            conn.execute(text(table_translation_cache))
            conn.execute(text(table_translation_cache_index))
            conn.commit()
        logger.info("Schema initialization complete.")
    except Exception as e:
        logger.error(f"Schema initialization failed: {e}")

# ---------------------------------------------------------
# Custom Tools for Lab Support
# ---------------------------------------------------------

@tool
def create_experiment(exp_name: str, researcher: str = "Assistant") -> str:
    """
    Creates a new experiment session.
    Use this tool when the user wants to start a new experiment.
    
    Args:
        exp_name: Unique name of the experiment (e.g., 'Exp_2024_A', 'Experiment 1').
        researcher: Name of the person conducting the experiment.
    """
    global db_engine
    if not db_engine:
        return "Database engine not initialized."
        
    query = "INSERT INTO Experiments (exp_name, researcher) VALUES (:name, :rscr)"
    try:
        with db_engine.connect() as conn:
            conn.execute(text(query), {"name": exp_name, "rscr": researcher})
            conn.commit()
        return f"Experiment '{exp_name}' created successfully."
    except Exception as e:
        return f"Failed to create experiment: {e}"

@tool
def log_experiment_data(exp_name: str, material: str, volume: float, density: float, mass: float = None) -> str:
    """
    Logs a measurement into a specific experiment.
    Use this tool when the user provides data (material, volume, density, etc.) for an existing experiment.
    
    Args:
        exp_name: The name of the experiment to add data to (must exist).
        material: Material name.
        volume: Volume value.
        density: Density value.
        mass: Mass value (optional).
    """
    global db_engine
    if not db_engine:
        return "Database engine not initialized."

    # Subquery insert to handle ID lookup
    insert_query = """
    INSERT INTO ExperimentData (exp_id, material, volume, density, mass)
    SELECT exp_id, :mat, :vol, :den, :mas
    FROM Experiments
    WHERE exp_name = :ename;
    """
    
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text(insert_query), {
                "mat": material, 
                "vol": volume, 
                "den": density, 
                "mas": mass, 
                "ename": exp_name
            })
            conn.commit()
            
            if result.rowcount == 0:
                return f"Error: Experiment '{exp_name}' not found. Please create it first."
        
        return f"Recorded {material} into '{exp_name}'."
    except Exception as e:
        return f"Error logging data: {e}"

# ---------------------------------------------------------
# Custom Tools for Fall Verification
# ---------------------------------------------------------

@tool
def fetch_pending_verification() -> str:
    """
    Retrieves the list of fall events that have been logged but not yet verified.
    Use this to find events that need operator confirmation.
    Returns JSON string of pending events.
    """
    global db_engine
    if not db_engine:
        return "Database engine not initialized."
    
    query = """
    SELECT TOP 5 EventID, Timestamp, CameraID, RiskAngle, ExperimentID 
    FROM FallEvents 
    WHERE VerificationStatus = 0 
    ORDER BY Timestamp DESC;
    """
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
            if not rows:
                return "No pending verification events found."
            
            # Format as string
            events = []
            for row in rows:
                events.append(f"EventID: {row.EventID}, Time: {row.Timestamp}, Cam: {row.CameraID}, Angle: {row.RiskAngle}")
            return "\\n".join(events)
    except Exception as e:
        return f"Error fetching pending falls: {e}"

@tool
def update_verification_status(event_id: int, status_code: int, subject: str = "Agent") -> str:
    """
    Updates the verification status of a fall event.
    
    Args:
        event_id: The ID of the event to update.
        status_code: 1 = Confirmed True Positive (Real Fall), 2 = False Positive (Glitch).
        subject: The entity performing the verification (default: 'Agent').
    """
    global db_engine
    if not db_engine:
        return "Database engine not initialized."

    query = """
    UPDATE FallEvents
    SET VerificationStatus = :status, VerifiedAt = GETUTCDATE(), VerifySubject = :subj
    WHERE EventID = :eid;
    """
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text(query), {"status": status_code, "eid": event_id, "subj": subject})
            conn.commit()
            if result.rowcount == 0:
                return f"Event {event_id} not found."
            return f"Event {event_id} status updated to {status_code} (Verified by {subject})."
    except Exception as e:
        return f"Error updating status: {e}"

@tool
def get_experiment_summary(experiment_id: str) -> str:
    """
    Retrieves summary stats for a specific experiment (e.g., total falls, confirmed, false alarms).
    """
    global db_engine
    if not db_engine:
        return "Database engine not initialized."
        
    query = """
    SELECT 
        COUNT(*) as TotalEvents,
        SUM(CASE WHEN VerificationStatus = 1 THEN 1 ELSE 0 END) as ConfirmedFalls,
        SUM(CASE WHEN VerificationStatus = 2 THEN 1 ELSE 0 END) as FalseAlarms,
        AVG(RiskAngle) as AvgRiskAngle
    FROM FallEvents
    WHERE ExperimentID = :expid;
    """
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text(query), {"expid": experiment_id})
            row = result.fetchone()
            if not row:
                return f"No data found for Experiment {experiment_id}"
            
            return (f"Experiment {experiment_id} Summary:\\n"
                    f"- Total Events: {row.TotalEvents}\\n"
                    f"- Confirmed Falls: {row.ConfirmedFalls}\\n"
                    f"- False Alarms: {row.FalseAlarms}\\n"
                    f"- Avg Risk Angle: {row.AvgRiskAngle:.1f}")
    except Exception as e:
        return f"Error fetching summary: {e}"

@tool
def get_storage_status(storage_id: str) -> str:
    """
    Retrieves the current status of a generic storage location (e.g., 'Alpha'), primarily for weight/occupancy.
    Returns status ('Occupied'/'Empty') and details like weight or empty duration.
    """
    global db_engine
    if not db_engine:
        return "Database engine not initialized."
        
    query = """
    SELECT TOP 1 StorageID, WeightValue, Status, EmptyTime, RecordedAt
    FROM WeightLog
    WHERE StorageID = :sid
    ORDER BY RecordedAt DESC;
    """
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text(query), {"sid": storage_id})
            row = result.fetchone()
            if not row:
                return f"No data found for Storage '{storage_id}'."
            
            # Format Output based on Status
            if row.Status == "Empty":
                return (f"Storage '{row.StorageID}' is currently EMPTY.\n"
                        f"- Duration: {row.EmptyTime} seconds\n"
                        f"- Last Recorded: {row.RecordedAt}")
            else:
                return (f"Storage '{row.StorageID}' is OCCUPIED.\n"
                        f"- Weight: {row.WeightValue}g\n"
                        f"- Last Recorded: {row.RecordedAt}")
    except Exception as e:
        return f"Error fetching storage status: {e}"

def create_conversational_agent(llm: AzureChatOpenAI, db: SQLDatabase) -> Any:
    """
    Create a SQL Agent with Few-Shot Prompting, Domain Knowledge, and Custom Tools.
    """
    
    # 1. Define Few-Shot Examples (Merged: Fall Detection + Lab Experiments)
    examples = [
        # --- [UPDATED] Fall Detection Examples (Focus: Most Recent & Correct Table Name) ---
        {
            "input": "가장 최근에 일어난 넘어짐 사고를 보고해.",
            "sql_cmd": "SELECT TOP 1 * FROM FallEvents WHERE Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"
        },
        {
            "input": "가장 최근에 일어난 엎어짐 사고의 시간을 보고해.",
            "sql_cmd": "SELECT TOP 1 Timestamp FROM FallEvents WHERE Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"
        },
        {
            "input": "Cylinder_Cam_01에서 발생한 마지막 사고가 언제야?",
            "sql_cmd": "SELECT TOP 1 Timestamp FROM FallEvents WHERE CameraID = 'Cylinder_Cam_01' AND Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"
        },
        
        # --- Lab Experiment WRITE Examples (Tool Usage) ---
        {
            "input": "새로운 실험 세션을 만들어줘. 이름은 'Experiment_001'이고 담당자는 'Kim'이야.",
            "sql_cmd": "FUNCTION_CALL: create_experiment(exp_name='Experiment_001', researcher='Kim')"
        },
        {
            "input": "'Experiment_001' 실험에 데이터 추가해. 물질은 'Graphene', 부피 10.5, 밀도 2.2, 질량 23.1.",
            "sql_cmd": "FUNCTION_CALL: log_experiment_data(exp_name='Experiment_001', material='Graphene', volume=10.5, density=2.2, mass=23.1)"
        },
        
        # --- Lab Experiment READ Examples (JOIN Queries) ---
        {
            "input": "'Experiment_001'에 대한 실험 정보를 다 보여줘.",
            "sql_cmd": "SELECT e.exp_name, e.researcher, e.created_at, d.material, d.volume, d.density, d.mass FROM Experiments e JOIN ExperimentData d ON e.exp_id = d.exp_id WHERE e.exp_name = 'Experiment_001';"
        },
        
        # --- Fall Verification Examples (Process Logic) ---
        {
            "input": "지금 확인 안 된 낙하 사고 있어?",
            "sql_cmd": "FUNCTION_CALL: fetch_pending_verification()"
        },
        {
            "input": "이벤트 105번은 진짜 넘어진 거 맞아. 확인 처리해줘.",
            "sql_cmd": "FUNCTION_CALL: update_verification_status(event_id=105, status_code=1, subject='Agent')"
        },
        {
            "input": "이벤트 106번은 센서 오류 같아. 무시해.",
            "sql_cmd": "FUNCTION_CALL: update_verification_status(event_id=106, status_code=2, subject='Agent')"
        },
        {
            "input": "'EXP_2024_A' 넘어짐 사고 요약해줘.",
            "sql_cmd": "FUNCTION_CALL: get_experiment_summary(experiment_id='EXP_2024_A')"
        },
        
        # --- Domain 4: Real-time Asset Monitoring Examples (WeightLog) ---
        {
            "input": "시약 창고 Alpha 비어있어?",
            "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"
        },
        {
            "input": "현재 무게 얼마야?",
            "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"
        },
        {
            "input": "지금 저울 상태 알려줘.",
            "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"
        },

        # --- Domain 5: Chemical Inventory Examples (Reagents) ---
        {
            "input": "우리 랩에 황산 재고 있어?",
            "sql_cmd": "SELECT * FROM Reagents WHERE name LIKE '%Sulfuric Acid%' OR name LIKE '%황산%';"
        },
        {
            "input": "수산화나트륨 얼마나 남았어?",
            "sql_cmd": "SELECT name, current_volume_value, current_volume_unit FROM Reagents WHERE name LIKE '%Sodium Hydroxide%' OR name LIKE '%수산화나트륨%';"
        }
    ]

    # 2. Define Example Formatter
    example_prompt = PromptTemplate(
        input_variables=["input", "sql_cmd"],
        template="User Input: {input}\nSQL Query/Action: {sql_cmd}"
    )

    # 3. Define Comprehensive System Prefix
    system_prefix = """
You are a smart laboratory assistant agent. You manage five distinct domains of data:

### Domain 1: Cylinder Stability (Fall Detection)
- **Table**: `FallEvents`
- **Logic**: 
  - `Status='FALL_CONFIRMED'` strictly means **'Overturned'** (lying on side, >45°), not just dropping.
  - **Risk Angle**: ~90° is fully prostrate (serious). 
  - If user asks about 'overturn', 'tip-over', 'upset', use `Status='FALL_CONFIRMED'`.

### Domain 2: Lab Experiments (Master-Detail)
- **Tables**: 
  - `Experiments` (Parent: exp_id, exp_name, researcher)
  - `ExperimentData` (Child: data_id, exp_id, material, volume, density...)
- **Logic**:
  - These tables are linked by `exp_id`.
  - **To READ**: When asked for experiment info, ALWAYS **JOIN** these two tables to show full context.
  - **To WRITE**: DO NOT generate `INSERT` SQL. You MUST use the provided tools: `create_experiment` or `log_experiment_data`.

### Domain 3: Fall Verification (Workflow)
- **Table**: `FallEvents` (EventID, VerificationStatus, ExperimentID...)
- **Status Codes**: 0 (Pending), 1 (Confirmed Real), 2 (False Alarm).
- **Workflow**:
  1. User asks to check pending falls -> Call `fetch_pending_verification`.
  2. Agent shows detail.
  3. User confirms or rejects specific EventID.
  4. Agent calls `update_verification_status`.

### Domain 4: Real-time Asset Monitoring (Arduino Scale)
- **Table**: `WeightLog` (LogID, StorageID, WeightValue, Status, EmptyTime, RecordedAt)
- **Logic**:
  - This table stores **LIVE sensor data** from an electronic scale.
  - **USE THE TOOL**: For any questions about current weight, status (empty/occupied), or duration of emptiness, use `get_storage_status`.
  - The tool returns formatted text easier for you to explain (e.g., "Empty for 30s").

### Domain 5: Chemical Inventory (Static Stock)
- **Table**: `Reagents` (reagent_id, name, current_volume_value, location...)
- **Logic**:
  - This table stores the **list of chemicals** owned by the lab (e.g., 'Sulfuric Acid', 'Methanol').
  - Use this ONLY if the user asks about "inventory", "stock list", or "properties" of a specific chemical.

### General Rules:
- **Priority**: If user asks "What is the weight now?", check **Domain 4 (Tool: get_storage_status)** first.
- Use MSSQL syntax (TOP instead of LIMIT).
- Always answer in Korean unless requested otherwise.

Here are examples of how to map user intent to SQL or Actions:
"""

    # 4. Construct Full Prompt
    few_shot_prompt = FewShotPromptTemplate(
        examples=examples,
        example_prompt=example_prompt,
        prefix=system_prefix,
        suffix="\nUser Input: {input}\nSQL Query/Action:",
        input_variables=["input"]
    )
    
    full_system_message = few_shot_prompt.format(input="")
    full_system_message = full_system_message.replace("\nUser Input: \nSQL Query/Action:", "")

    try:
        agent_executor = create_sql_agent(
            llm=llm,
            db=db,
            agent_type="openai-tools",
            verbose=True,
            handle_parsing_errors=True,
            prefix=full_system_message,
            extra_tools=[
                create_experiment, 
                log_experiment_data,
                fetch_pending_verification,
                update_verification_status,
                get_experiment_summary,
                get_storage_status
            ] # Injecting Custom Tools
        )
        logger.info("Conversational SQL Agent created with Lab Tools and Few-Shot Context.")
        return agent_executor
    except Exception as e:
        logger.error(f"Failed to create SQL Agent: {e}")
        raise

def main():
    global db_engine
    try:
        load_environment()
        
        # 0. Initialize Azure Monitor Tracing
        conn_str = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
        if conn_str:
            configure_azure_monitor()
            LangchainInstrumentor().instrument()
            logger.info("✅ Azure Monitor & Tracing enabled. Sending telemetry to Azure AI Foundry.")
        else:
            logger.warning("⚠️ Tracing skipped: APPLICATIONINSIGHTS_CONNECTION_STRING not found.")
        
        # Initialize Engine and DB
        conn_str = get_connection_string()
        db_engine = create_engine(
            conn_str,
            pool_pre_ping=True,  # 쿼리 전 연결 유효성 검사
            pool_recycle=1800,   # 30분마다 연결 재생성 (Azure SQL 타임아웃 대응)
        )
        
        # Initialize Schema (Ensure tables exist)
        init_db_schema(db_engine)
        
        db = SQLDatabase(db_engine)
        llm = get_azure_openai_llm()
        
        # 1. Initialize Azure OpenAI LLM helper (Defined in previous steps, ensuring it's here)
        def get_azure_openai_llm_helper():
            return AzureChatOpenAI(
                azure_deployment=os.getenv("AZURE_DEPLOYMENT_NAME"),
                api_version=os.getenv("OPENAI_API_VERSION"),
                temperature=0,
                verbose=True
            )
        
        # Overwrite the global llm getter or just call it directly if defined in global scope
        # In this script, I'll use the local helper for clarity if the function above is missing, 
        # but I included `get_azure_openai_llm` in the file above.

        agent_executor = create_conversational_agent(llm, db)
        
        print("\n" + "="*50)
        print("🤖 Lab Support SQL Agent is ready! (Type 'exit' to quit)")
        print("💡 Capabilities:")
        print("   1. Fall Detection queries ('엎어짐', '각도')")
        print("   2. Lab Experiments ('실험 A 생성해', '데이터 추가해', '실험 정보 보여줘')")
        print("="*50 + "\n")

        while True:
            try:
                user_input = input("User> ")
                if user_input.lower() in ["exit", "quit", "q"]:
                    print("Goodbye!")
                    break
                
                if not user_input.strip():
                    continue

                response = agent_executor.invoke({"input": user_input})
                
                print("\n" + "-"*50)
                print(f"Agent> {response['output']}")
                print("-"*50 + "\n")
                
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                logger.error(f"Error during interaction: {e}")
                print(f"Error: {e}")

    except Exception as e:
        logger.critical(f"Unexpected error: {e}")
        exit(1)

def get_azure_openai_llm() -> AzureChatOpenAI:
    return AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_DEPLOYMENT_NAME"),
        api_version=os.getenv("OPENAI_API_VERSION"),
        temperature=0,
        verbose=True
    )

if __name__ == "__main__":
    main()
