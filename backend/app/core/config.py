from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "troque-essa-chave-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./fightclub.db"

    model_config = {"env_file": ".env"}


settings = Settings()
