from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    mongodb_uri: str = (
        "mongodb+srv://sauravanand243:Ejse5gkM6dG0UECt@cluster0.9jeqyld.mongodb.net/?retryWrites=true&w=majority"  # Add default for dev
    )
    mongodb_db: str = "medical_chatbot"
    mongodb_session_collection: str = "sessions"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
