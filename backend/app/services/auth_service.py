from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.academy import Academy
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, TokenResponse


def register_user(data: RegisterRequest, db: Session) -> TokenResponse:
    if data.role not in ("teacher", "student"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role inválida. Use 'teacher' ou 'student'.",
            headers={"code": "INVALID_ROLE"},
        )

    if data.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Alunos só podem ser criados por um professor.",
            headers={"code": "FORBIDDEN"},
        )

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado.",
            headers={"code": "EMAIL_ALREADY_EXISTS"},
        )

    academy = Academy(name=data.academy_name)
    db.add(academy)
    db.flush()

    user = User(
        email=data.email,
        password=hash_password(data.password),
        role="teacher",
        academy_id=academy.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        {"sub": str(user.id), "role": user.role, "academy_id": user.academy_id}
    )
    return TokenResponse(access_token=token)


def login_user(data: LoginRequest, db: Session) -> LoginResponse:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"code": "INVALID_CREDENTIALS"},
        )

    token = create_access_token(
        {"sub": str(user.id), "role": user.role, "academy_id": user.academy_id}
    )
    return LoginResponse(access_token=token, role=user.role)
