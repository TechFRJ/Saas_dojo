"""Tests for authentication endpoints."""


def test_register_teacher_success(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "novo@test.com",
            "password": "senha123",
            "role": "teacher",
            "academy_name": "Nova Academia",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_student_directly_forbidden(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "aluno@test.com",
            "password": "senha123",
            "role": "student",
            "academy_name": "Qualquer",
        },
    )
    assert resp.status_code == 403
    body = resp.json()
    assert "detail" in body


def test_register_duplicate_email(client):
    payload = {
        "email": "dup@test.com",
        "password": "123456",
        "role": "teacher",
        "academy_name": "Academia Dup",
    }
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_login_success(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "login@test.com",
            "password": "senha123",
            "role": "teacher",
            "academy_name": "Login Academy",
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "login@test.com", "password": "senha123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "role" in data
    assert data["role"] == "teacher"


def test_login_invalid_credentials(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "naoexiste@test.com", "password": "errado"},
    )
    assert resp.status_code == 401
    body = resp.json()
    assert "detail" in body


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "wp@test.com",
            "password": "correta",
            "role": "teacher",
            "academy_name": "WP Academy",
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "wp@test.com", "password": "errada"},
    )
    assert resp.status_code == 401


def test_me_authenticated(client, teacher_token):
    resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "prof@test.com"
    assert data["role"] == "teacher"
    assert "academy_id" in data


def test_me_without_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 403


def test_me_invalid_token(client):
    resp = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer token_invalido_aqui"},
    )
    assert resp.status_code == 401


def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
