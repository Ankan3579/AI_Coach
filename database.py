"""Optional Firebase Firestore persistence for resume analysis reports.

Callers must pass the user ID obtained from the application's verified
authentication context, never a user ID submitted by an untrusted client.
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
logger = logging.getLogger(__name__)
_firebase_app = None
_firestore_client = None
_initialization_attempted = False
_firebase_error_types: tuple[type[Exception], ...] = (OSError, ValueError)


def initialize_firebase() -> Any | None:
    """Return the Firestore client, or None when Firebase is unavailable."""
    global _firebase_app, _firestore_client, _initialization_attempted
    global _firebase_error_types

    if _firestore_client is not None:
        return _firestore_client
    if _initialization_attempted:
        return None
    _initialization_attempted = True

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not project_id:
        logger.info("Firebase is not configured; report persistence is disabled.")
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        from firebase_admin.exceptions import FirebaseError
        from google.api_core.exceptions import GoogleAPICallError
        from google.auth.exceptions import GoogleAuthError
    except ImportError:
        logger.warning(
            "Firebase Admin SDK is unavailable; report persistence is disabled."
        )
        return None

    _firebase_error_types = (
        FirebaseError,
        GoogleAPICallError,
        GoogleAuthError,
        OSError,
        ValueError,
    )
    try:
        try:
            _firebase_app = firebase_admin.get_app()
        except ValueError:
            credential = (
                credentials.Certificate(str(Path(credentials_path)))
                if credentials_path
                else None
            )
            _firebase_app = firebase_admin.initialize_app(
                credential,
                options={"projectId": project_id},
            )
        _firestore_client = firestore.client(_firebase_app)
        return _firestore_client
    except _firebase_error_types as error:
        logger.warning(
            "Firebase initialization failed (%s); persistence is disabled.",
            type(error).__name__,
        )
        return None


def save_resume_analysis(
    report: BaseModel | Mapping[str, Any],
    *,
    authenticated_user_id: str,
) -> str | None:
    """Save a minimized report under its already-authenticated user's path."""
    user_id = _validated_user_id(authenticated_user_id)
    report_data = (
        report.model_dump(mode="json")
        if isinstance(report, BaseModel)
        else dict(report)
    )
    report_id = str(report_data.get("report_id") or uuid.uuid4())

    client = initialize_firebase()
    if client is None:
        return None

    document = {
        "report_id": report_id,
        "user_id": user_id,
        "target_role": report_data.get("target_role", ""),
        "overall_score": report_data.get("overall_score"),
        "category_scores": {
            category: (
                value.get("score")
                if isinstance(value, Mapping)
                else value
            )
            for category, value in report_data.get("category_scores", {}).items()
        },
        "strengths": report_data.get("strengths", []),
        "weaknesses": report_data.get("weaknesses", []),
        "extracted_skills": report_data.get("technical_skills", []),
        "improvement_suggestions": {
            "recommendations": report_data.get("recommendations", []),
            "project_feedback": report_data.get("project_feedback", []),
            "professional_summary": report_data.get(
                "professional_summary_suggestions", []
            ),
        },
        "job_description_match": report_data.get("job_description_match"),
        "analysis_timestamp": datetime.now(timezone.utc),
        "analysis_version": report_data.get("analysis_version", ""),
    }

    try:
        (
            client.collection("users")
            .document(user_id)
            .collection("resume_reports")
            .document(report_id)
            .set(document)
        )
    except _firebase_error_types as error:
        _log_firestore_error("saving", error)
        return None

    return report_id


def get_resume_report(
    report_id: str,
    *,
    authenticated_user_id: str,
) -> dict[str, Any] | None:
    """Retrieve a report only from the verified user's own collection."""
    user_id = _validated_user_id(authenticated_user_id)
    client = initialize_firebase()
    if client is None:
        return None

    try:
        snapshot = (
            client.collection("users")
            .document(user_id)
            .collection("resume_reports")
            .document(report_id)
            .get()
        )
        if not snapshot.exists:
            return None
        report = snapshot.to_dict()
    except _firebase_error_types as error:
        _log_firestore_error("retrieving", error)
        return None

    if not report or report.get("user_id") != user_id:
        logger.warning("A resume report failed its ownership check.")
        return None
    return report


def list_resume_reports(
    *,
    authenticated_user_id: str,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """List reports from the authenticated user's collection only."""
    user_id = _validated_user_id(authenticated_user_id)
    if limit < 1:
        raise ValueError("limit must be greater than zero.")

    client = initialize_firebase()
    if client is None:
        return []

    try:
        reports = (
            client.collection("users")
            .document(user_id)
            .collection("resume_reports")
            .limit(limit)
            .stream()
        )
        return [
            report_data
            for snapshot in reports
            if (report_data := snapshot.to_dict())
            and report_data.get("user_id") == user_id
        ]
    except _firebase_error_types as error:
        _log_firestore_error("listing", error)
        return []


def delete_resume_report(
    report_id: str,
    *,
    authenticated_user_id: str,
) -> bool:
    """Delete a report only after confirming it belongs to the verified user."""
    user_id = _validated_user_id(authenticated_user_id)
    client = initialize_firebase()
    if client is None:
        return False

    reference = (
        client.collection("users")
        .document(user_id)
        .collection("resume_reports")
        .document(report_id)
    )
    try:
        snapshot = reference.get()
        if not snapshot.exists:
            return False
        report = snapshot.to_dict()
        if not report or report.get("user_id") != user_id:
            logger.warning("A resume report failed its ownership check.")
            return False
        reference.delete()
    except _firebase_error_types as error:
        _log_firestore_error("deleting", error)
        return False

    return True


def _validated_user_id(authenticated_user_id: str) -> str:
    if not isinstance(authenticated_user_id, str) or not authenticated_user_id.strip():
        raise ValueError(
            "Pass the user ID from the application's verified authentication context."
        )
    return authenticated_user_id.strip()


def _log_firestore_error(operation: str, error: Exception) -> None:
    logger.warning(
        "Firebase Firestore %s failed (%s); continuing without persistence.",
        operation,
        type(error).__name__,
    )
