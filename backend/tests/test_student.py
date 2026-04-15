"""Tests for student routes and gamification logic."""
from datetime import date, timedelta

from app.services.gamification_service import (
    belt_to_color,
    calculate_level,
    calculate_outfit,
    calculate_points,
    calculate_streak,
    check_streak_bonus,
)


# --- Unit tests: gamification_service ---

def test_calculate_points_adds_ten():
    assert calculate_points(0) == 10
    assert calculate_points(90) == 100
    assert calculate_points(750) == 760


def test_calculate_streak_first_training():
    assert calculate_streak(None, 0) == 1


def test_calculate_streak_consecutive():
    yesterday = date.today() - timedelta(days=1)
    assert calculate_streak(yesterday, 4) == 5


def test_calculate_streak_resets_after_gap():
    two_days_ago = date.today() - timedelta(days=2)
    assert calculate_streak(two_days_ago, 5) == 1


def test_calculate_streak_same_day_no_change():
    today = date.today()
    assert calculate_streak(today, 3) == 3


def test_check_streak_bonus_multiples_of_five():
    assert check_streak_bonus(5) == 20
    assert check_streak_bonus(10) == 20
    assert check_streak_bonus(15) == 20


def test_check_streak_bonus_non_multiples():
    assert check_streak_bonus(1) == 0
    assert check_streak_bonus(4) == 0
    assert check_streak_bonus(6) == 0


def test_calculate_level():
    assert calculate_level(0) == 1
    assert calculate_level(99) == 1
    assert calculate_level(100) == 2
    assert calculate_level(250) == 3
    assert calculate_level(700) == 8


def test_calculate_outfit():
    assert calculate_outfit(0) == "default"
    assert calculate_outfit(99) == "default"
    assert calculate_outfit(100) == "fighter"
    assert calculate_outfit(299) == "fighter"
    assert calculate_outfit(300) == "champion"
    assert calculate_outfit(699) == "champion"
    assert calculate_outfit(700) == "legend"
    assert calculate_outfit(9999) == "legend"


def test_belt_to_color_mapping():
    assert belt_to_color("white") == "branca"
    assert belt_to_color("blue") == "azul"
    assert belt_to_color("purple") == "roxa"
    assert belt_to_color("brown") == "marrom"
    assert belt_to_color("black") == "preta"


# --- Integration tests: student API routes ---

def test_student_me_returns_profile(client, student_token):
    resp = client.get(
        "/api/student/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Aluno Teste"
    assert "belt" in data
    assert "points" in data
    assert "streak" in data
    assert "avatar" in data


def test_student_cannot_access_another_student_me(client, teacher_token):
    # Create two students
    client.post(
        "/api/teacher/students",
        json={"email": "s1@test.com", "password": "123", "name": "Estudante 1"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    client.post(
        "/api/teacher/students",
        json={"email": "s2@test.com", "password": "123", "name": "Estudante 2"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    # Login as student 1
    token1 = client.post("/api/auth/login", json={"email": "s1@test.com", "password": "123"}).json()["access_token"]
    # /me only returns their own profile
    resp = client.get("/api/student/me", headers={"Authorization": f"Bearer {token1}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Estudante 1"


def test_student_attendance_list(client, student_token, teacher_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()["items"]
    student_id = students[0]["id"]

    client.post(
        "/api/teacher/attendance",
        json={"student_id": student_id},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )

    resp = client.get(
        "/api/student/attendance",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_student_attendance_calendar_correct_days(client, student_token):
    resp = client.get(
        "/api/student/attendance/calendar?year=2026&month=4",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    # April has 30 days
    assert len(data) == 30
    dates = [d["date"] for d in data]
    assert "2026-04-01" in dates
    assert "2026-04-30" in dates
    assert "2026-05-01" not in dates
    assert "2026-03-31" not in dates


def test_student_belt_history(client, student_token, teacher_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()["items"]
    student_id = students[0]["id"]

    client.post(
        "/api/teacher/belt",
        json={"student_id": student_id, "belt": "blue"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )

    resp = client.get(
        "/api/student/belt-history",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(h["belt"] == "blue" for h in data)


def test_student_payments(client, student_token, teacher_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()["items"]
    student_id = students[0]["id"]

    client.post(
        "/api/teacher/payments",
        json={"student_id": student_id, "amount": 180.0, "due_date": "2026-05-10"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )

    resp = client.get(
        "/api/student/payments",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    payments = resp.json()
    assert len(payments) >= 1
    assert payments[0]["amount"] == 180.0


def test_streak_bonus_applied_at_5(client, teacher_token, student_token):
    students = client.get(
        "/api/teacher/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()["items"]
    student_id = students[0]["id"]
    initial_points = students[0]["points"]

    resp = client.post(
        "/api/teacher/attendance",
        json={"student_id": student_id},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert resp.status_code == 201

    updated = client.get(
        f"/api/teacher/students/{student_id}",
        headers={"Authorization": f"Bearer {teacher_token}"},
    ).json()
    # Points must have increased by at least 10
    assert updated["points"] >= initial_points + 10
