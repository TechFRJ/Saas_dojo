from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_teacher
from app.database import get_db
from app.models.attendance import Attendance
from app.models.payment import Payment
from app.models.student import StudentProfile
from app.models.user import User

router = APIRouter(prefix="/api/teacher/reports", tags=["reports"])

WEEKDAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]


def _get_academy_student_ids(academy_id: int, db: Session) -> list[int]:
    student_users = (
        db.query(User)
        .filter(User.academy_id == academy_id, User.role == "student")
        .all()
    )
    return [u.student_profile.id for u in student_users if u.student_profile]


@router.get("/attendance")
def attendance_report(
    period: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    student_ids = _get_academy_student_ids(current_user.academy_id, db)
    today = date.today()
    start = today - timedelta(days=period - 1)

    attendances = (
        db.query(Attendance)
        .filter(
            Attendance.student_id.in_(student_ids),
            Attendance.date >= start,
            Attendance.date <= today,
        )
        .all()
    )

    total_trainings = len(attendances)
    avg_per_day = round(total_trainings / period, 1) if period > 0 else 0

    # Count per day
    day_counts: dict[date, int] = defaultdict(int)
    for att in attendances:
        day_counts[att.date] += 1

    best_day = None
    worst_day = None
    if day_counts:
        best_date = max(day_counts, key=lambda d: day_counts[d])
        worst_date = min(day_counts, key=lambda d: day_counts[d])
        best_day = {"date": str(best_date), "count": day_counts[best_date]}
        worst_day = {"date": str(worst_date), "count": day_counts[worst_date]}

    # Average by weekday (Monday=0 ... Sunday=6)
    weekday_counts: dict[int, list[int]] = defaultdict(list)
    for att in attendances:
        weekday_counts[att.date.weekday()].append(1)

    by_weekday = []
    for i, name in enumerate(WEEKDAY_NAMES):
        counts = weekday_counts.get(i, [])
        avg = round(len(counts) / (period / 7), 1) if period >= 7 and counts else 0
        by_weekday.append({"day": name, "avg": avg, "total": len(counts)})

    return {
        "period_days": period,
        "total_trainings": total_trainings,
        "avg_per_day": avg_per_day,
        "best_day": best_day,
        "worst_day": worst_day,
        "by_weekday": by_weekday,
    }


@router.get("/churn-risk")
def churn_risk(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    student_ids = _get_academy_student_ids(current_user.academy_id, db)
    today = date.today()

    students = (
        db.query(StudentProfile).filter(StudentProfile.id.in_(student_ids)).all()
    )

    result = []
    for student in students:
        if student.last_training is None:
            days_since = None
        else:
            last_date = student.last_training.date()
            days_since = (today - last_date).days

        if days_since is None or days_since < 2:
            continue

        if days_since >= 7:
            risk = "high"
        elif days_since >= 4:
            risk = "medium"
        else:
            risk = "low"

        result.append(
            {
                "student_id": student.id,
                "name": student.name,
                "days_since_last_training": days_since,
                "streak_lost": student.streak == 0,
                "risk": risk,
            }
        )

    # Sort: high → medium → low
    risk_order = {"high": 0, "medium": 1, "low": 2}
    result.sort(key=lambda x: (risk_order[x["risk"]], x["days_since_last_training"]))

    return result


@router.get("/revenue")
def revenue_report(
    months: int = Query(3, ge=1, le=12),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    student_ids = _get_academy_student_ids(current_user.academy_id, db)
    today = date.today()

    month_data = []
    total_paid = 0.0
    total_pending = 0.0
    total_late = 0.0

    for i in range(months - 1, -1, -1):
        if today.month - i <= 0:
            year = today.year - 1
            month_num = today.month - i + 12
        else:
            year = today.year
            month_num = today.month - i

        import calendar

        last_day = calendar.monthrange(year, month_num)[1]
        start = date(year, month_num, 1)
        end = date(year, month_num, last_day)

        payments = (
            db.query(Payment)
            .filter(
                Payment.student_id.in_(student_ids),
                Payment.due_date >= start,
                Payment.due_date <= end,
            )
            .all()
        )

        paid = sum(p.amount for p in payments if p.status == "paid")
        pending = sum(p.amount for p in payments if p.status == "pending")
        late = sum(p.amount for p in payments if p.status == "late")

        total_paid += paid
        total_pending += pending
        total_late += late

        month_data.append(
            {
                "month": f"{year}-{month_num:02d}",
                "paid": round(paid, 2),
                "pending": round(pending, 2),
                "late": round(late, 2),
            }
        )

    grand_total = total_paid + total_pending + total_late
    collection_rate = round(total_paid / grand_total * 100, 1) if grand_total > 0 else 0

    return {
        "months": month_data,
        "total_paid": round(total_paid, 2),
        "total_pending": round(total_pending, 2),
        "collection_rate": collection_rate,
    }
