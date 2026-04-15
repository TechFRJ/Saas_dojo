from datetime import date

from sqlalchemy.orm import Session

from app.models.goal import Goal


def update_goal_progress(student_id: int, db: Session) -> None:
    """
    Incrementa `current` nas metas ativas do aluno para weekly_trainings e monthly_trainings.
    Marca completed=True se current >= target.
    Chamado após cada presença registrada.
    """
    today = date.today()
    iso_year, iso_week, _ = today.isocalendar()
    week_period = f"{iso_year}-W{iso_week:02d}"
    month_period = today.strftime("%Y-%m")

    active_goals = (
        db.query(Goal)
        .filter(
            Goal.student_id == student_id,
            Goal.completed == False,  # noqa: E712
        )
        .all()
    )

    for goal in active_goals:
        if goal.type == "weekly_trainings" and goal.period == week_period:
            goal.current += 1
            if goal.current >= goal.target:
                goal.completed = True
        elif goal.type == "monthly_trainings" and goal.period == month_period:
            goal.current += 1
            if goal.current >= goal.target:
                goal.completed = True

    db.commit()
