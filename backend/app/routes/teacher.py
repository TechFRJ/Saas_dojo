from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_teacher
from app.database import get_db
from app.models.attendance import Attendance
from app.models.avatar import AvatarConfig
from app.models.belt import BeltHistory
from app.models.payment import Payment
from app.models.student import StudentProfile
from app.models.user import User
from app.schemas.student import (
    AttendanceCreate,
    AttendanceOut,
    BeltHistoryOut,
    BeltUpdate,
    DashboardOut,
    PaymentCreate,
    PaymentOut,
    PaymentUpdate,
    StudentCreate,
    StudentDetailOut,
    StudentProfileOut,
    StudentUpdate,
)
from app.services import attendance_service
from app.services.gamification_service import belt_to_color, calculate_level, calculate_outfit
from app.core.security import hash_password

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    academy_id = current_user.academy_id
    today = date.today()
    month_start = today.replace(day=1)
    thirty_days_ago = today - timedelta(days=30)

    student_users = (
        db.query(User)
        .filter(User.academy_id == academy_id, User.role == "student")
        .all()
    )
    student_ids = [u.student_profile.id for u in student_users if u.student_profile]

    total_students = len(student_ids)

    students_today = (
        db.query(Attendance)
        .filter(Attendance.student_id.in_(student_ids), Attendance.date == today)
        .count()
    )

    monthly_revenue = (
        db.query(Payment)
        .filter(
            Payment.student_id.in_(student_ids),
            Payment.status == "paid",
            Payment.due_date >= month_start,
            Payment.due_date <= today,
        )
        .all()
    )
    monthly_revenue_total = sum(p.amount for p in monthly_revenue)

    active_student_ids = (
        db.query(Attendance.student_id)
        .filter(
            Attendance.student_id.in_(student_ids),
            Attendance.date >= thirty_days_ago,
        )
        .distinct()
        .all()
    )
    active_students = len(active_student_ids)

    return DashboardOut(
        total_students=total_students,
        students_today=students_today,
        monthly_revenue=monthly_revenue_total,
        active_students=active_students,
    )


@router.post("/students", response_model=StudentProfileOut, status_code=201)
def create_student(
    data: StudentCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado.",
            headers={"code": "EMAIL_ALREADY_EXISTS"},
        )

    user = User(
        email=data.email,
        password=hash_password(data.password),
        role="student",
        academy_id=current_user.academy_id,
    )
    db.add(user)
    db.flush()

    profile = StudentProfile(user_id=user.id, name=data.name)
    db.add(profile)
    db.flush()

    avatar = AvatarConfig(
        student_id=profile.id,
        belt_color=belt_to_color(profile.belt),
        outfit=calculate_outfit(profile.points),
        level=calculate_level(profile.points),
    )
    db.add(avatar)
    db.commit()
    db.refresh(profile)

    return profile


@router.get("/students", response_model=list[StudentProfileOut])
def list_students(
    belt: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    student_users = (
        db.query(User)
        .filter(User.academy_id == current_user.academy_id, User.role == "student")
        .all()
    )
    profile_ids = [u.student_profile.id for u in student_users if u.student_profile]

    query = db.query(StudentProfile).filter(StudentProfile.id.in_(profile_ids))

    if belt:
        query = query.filter(StudentProfile.belt == belt)
    if search:
        query = query.filter(StudentProfile.name.ilike(f"%{search}%"))

    return query.all()


@router.get("/students/{student_id}", response_model=StudentDetailOut)
def get_student(
    student_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    from app.schemas.student import AttendanceOut, BeltHistoryOut, PaymentOut

    profile = _get_student_in_academy(student_id, current_user.academy_id, db)

    recent_attendances = (
        db.query(Attendance)
        .filter(Attendance.student_id == profile.id)
        .order_by(Attendance.date.desc())
        .limit(30)
        .all()
    )

    return StudentDetailOut(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        belt=profile.belt,
        points=profile.points,
        streak=profile.streak,
        last_training=profile.last_training,
        created_at=profile.created_at,
        avatar=profile.avatar,
        belt_history=profile.belt_history,
        attendances=recent_attendances,
        payments=profile.payments,
    )


@router.put("/students/{student_id}", response_model=StudentProfileOut)
def update_student(
    student_id: int,
    data: StudentUpdate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    profile = _get_student_in_academy(student_id, current_user.academy_id, db)

    if data.name is not None:
        profile.name = data.name
    if data.belt is not None:
        profile.belt = data.belt
        if profile.avatar:
            profile.avatar.belt_color = belt_to_color(data.belt)
    if data.points is not None:
        profile.points = data.points

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/attendance", response_model=AttendanceOut, status_code=201)
def register_attendance(
    data: AttendanceCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    _get_student_in_academy(data.student_id, current_user.academy_id, db)
    return attendance_service.register(data.student_id, db)


@router.get("/attendance", response_model=list[AttendanceOut])
def list_attendance(
    student_id: Optional[int] = Query(None),
    date_filter: Optional[str] = Query(None, alias="date"),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    student_users = (
        db.query(User)
        .filter(User.academy_id == current_user.academy_id, User.role == "student")
        .all()
    )
    profile_ids = [u.student_profile.id for u in student_users if u.student_profile]

    query = db.query(Attendance).filter(Attendance.student_id.in_(profile_ids))

    if student_id:
        query = query.filter(Attendance.student_id == student_id)

    if date_filter:
        if len(date_filter) == 7:
            year, month = date_filter.split("-")
            from calendar import monthrange

            last_day = monthrange(int(year), int(month))[1]
            start = date(int(year), int(month), 1)
            end = date(int(year), int(month), last_day)
            query = query.filter(Attendance.date >= start, Attendance.date <= end)
        else:
            parsed = date.fromisoformat(date_filter)
            query = query.filter(Attendance.date == parsed)

    return query.order_by(Attendance.date.desc()).all()


@router.get("/payments", response_model=list[PaymentOut])
def list_payments(
    status_filter: Optional[str] = Query(None, alias="status"),
    student_id: Optional[int] = Query(None),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    student_users = (
        db.query(User)
        .filter(User.academy_id == current_user.academy_id, User.role == "student")
        .all()
    )
    profile_ids = [u.student_profile.id for u in student_users if u.student_profile]

    query = db.query(Payment).filter(Payment.student_id.in_(profile_ids))

    if status_filter:
        query = query.filter(Payment.status == status_filter)
    if student_id:
        query = query.filter(Payment.student_id == student_id)

    return query.order_by(Payment.due_date.desc()).all()


@router.post("/payments", response_model=PaymentOut, status_code=201)
def create_payment(
    data: PaymentCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    _get_student_in_academy(data.student_id, current_user.academy_id, db)
    payment = Payment(
        student_id=data.student_id,
        amount=data.amount,
        due_date=data.due_date,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.put("/payments/{payment_id}", response_model=PaymentOut)
def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    student_users = (
        db.query(User)
        .filter(User.academy_id == current_user.academy_id, User.role == "student")
        .all()
    )
    profile_ids = [u.student_profile.id for u in student_users if u.student_profile]

    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.student_id.in_(profile_ids))
        .first()
    )
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado.",
            headers={"code": "PAYMENT_NOT_FOUND"},
        )

    payment.status = data.status
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/belt", response_model=StudentProfileOut)
def promote_belt(
    data: BeltUpdate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    profile = _get_student_in_academy(data.student_id, current_user.academy_id, db)

    profile.belt = data.belt
    if profile.avatar:
        profile.avatar.belt_color = belt_to_color(data.belt)

    history = BeltHistory(
        student_id=profile.id, belt=data.belt, promoted_at=date.today()
    )
    db.add(history)
    db.commit()
    db.refresh(profile)
    return profile


def _get_student_in_academy(
    student_id: int, academy_id: int, db: Session
) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado.",
            headers={"code": "STUDENT_NOT_FOUND"},
        )

    user = db.query(User).filter(User.id == profile.user_id).first()
    if not user or user.academy_id != academy_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aluno não pertence a esta academia.",
            headers={"code": "FORBIDDEN"},
        )

    return profile
