import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_fightclub.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def teacher_token(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "prof@test.com",
            "password": "senha123",
            "role": "teacher",
            "academy_name": "Test Academy",
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "prof@test.com", "password": "senha123"},
    )
    return resp.json()["access_token"]


@pytest.fixture(scope="function")
def student_token(client, teacher_token):
    client.post(
        "/api/teacher/students",
        json={"email": "aluno@test.com", "password": "senha123", "name": "Aluno Teste"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "aluno@test.com", "password": "senha123"},
    )
    return resp.json()["access_token"]
