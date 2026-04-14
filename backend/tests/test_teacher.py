"""Tests for teacher routes."""
from datetime import date, timedelta


def test_dashboard_requires_auth(client):
    resp = client.get("/api/teacher/dashboard")
    assert resp.status_code == 403


def test_dashboard_accessible_by_teacher(client, teacher_token):
    resp = client.get(
        "/api/teacher/dashboard",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "total_students" in data
    assert "students_today" in data
    assert "monthly_revenue" in data
    assert "active_students" in data


def test_create_student(client, teacher_token):
    resp = client.post(
        "/api/teacher/students",
        json={"email": "novo_aluno@test.com", "password": "senha123", "name": "Novo Aluno"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Novo Aluno"
    assert data["belt"] == "white"
    assert data["points"] == 0


def test_create_student_creates_avatar(client, teacher_token):
    resp = client.post(
        "/api/teacher/students",
        json={"email": "avatar_aluno@test.com", "password": "senha123", "name": "Avatar Aluno"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["avatar"] is not None
    assert data["avatar"]["belt_color"] == "branca"
    assert data["avatar"]["outfit"] == "default"
    assert data["avatar"]["level"] == 1


def test_list_students(client, teacher_token, student_token):
    resp = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_list_students_search(client, teacher_token):
    client.post(
        "/api/teacher/students",
        json={"email": "joao@test.com", "password": "123", "name": "João Pesquisado"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    resp = client.get(
        "/api/teacher/students?search=João",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 200
    names = [s["name"] for s in resp.json()]
    assert any("João" in n for n in names)


def test_get_student_detail(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    student_id = students[0]["id"]

    resp = client.get(
        f"/api/teacher/students/{student_id}",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "belt_history" in data
    assert "payments" in data


def test_register_attendance(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    student_id = students[0]["id"]

    resp = client.post(
        "/api/teacher/attendance",
        json={"student_id": student_id},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["student_id"] == student_id
    assert "date" in data


def test_attendance_duplicate_returns_error(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    student_id = students[0]["id"]

    client.post(
        "/api/teacher/attendance",
        json={"student_id": student_id},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    resp = client.post(
        "/api/teacher/attendance",
        json={"student_id": student_id},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 409
    body = resp.json()
    assert "detail" in body
    assert "code" in body


def test_attendance_updates_points(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    student = students[0]
    initial_points = student["points"]

    client.post(
        "/api/teacher/attendance",
        json={"student_id": student["id"]},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )

    updated = client.get(
        f"/api/teacher/students/{student['id']}",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    assert updated["points"] >= initial_points + 10


def test_promote_belt_creates_history(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    student_id = students[0]["id"]

    resp = client.post(
        "/api/teacher/belt",
        json={"student_id": student_id, "belt": "blue"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["belt"] == "blue"

    detail = client.get(
        f"/api/teacher/students/{student_id}",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    belts = [h["belt"] for h in detail["belt_history"]]
    assert "blue" in belts


def test_promote_belt_updates_avatar(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    student_id = students[0]["id"]

    resp = client.post(
        "/api/teacher/belt",
        json={"student_id": student_id, "belt": "purple"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["avatar"]["belt_color"] == "roxa"


def test_create_payment(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    student_id = students[0]["id"]

    resp = client.post(
        "/api/teacher/payments",
        json={"student_id": student_id, "amount": 200.0, "due_date": "2026-05-10"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["amount"] == 200.0
    assert data["status"] == "pending"


def test_update_payment_status(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    student_id = students[0]["id"]

    payment = client.post(
        "/api/teacher/payments",
        json={"student_id": student_id, "amount": 150.0, "due_date": "2026-06-10"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()

    resp = client.put(
        f"/api/teacher/payments/{payment['id']}",
        json={"status": "paid"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "paid"


def test_teacher_cannot_access_other_academy_student(client, teacher_token):
    # Register second academy
    client.post(
        "/api/auth/register",
        json={
            "email": "prof2@test.com",
            "password": "senha123",
            "role": "teacher",
            "academy_name": "Outra Academia",
        },
    )
    token2 = client.post(
        "/api/auth/login",
        json={"email": "prof2@test.com", "password": "senha123"},
    ).json()["access_token"]

    # Teacher 2 creates a student
    student_resp = client.post(
        "/api/teacher/students",
        json={"email": "aluno_outro@test.com", "password": "123", "name": "Aluno Outro"},
        headers={"Authorization": f"Bearer {token2}"},
    ).json()
    other_student_id = student_resp["id"]

    # Teacher 1 tries to access teacher 2's student
    resp = client.get(
        f"/api/teacher/students/{other_student_id}",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 403


def test_dashboard_counts_correct(client, teacher_token):
    resp = client.get(
        "/api/teacher/dashboard",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    data = resp.json()
    assert data["total_students"] == 0  # No students yet in this test


def test_student_cannot_access_teacher_routes(client, student_token):
    resp = client.get(
        "/api/teacher/dashboard",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403
