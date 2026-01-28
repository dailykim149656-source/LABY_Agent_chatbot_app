from datetime import datetime, timezone

from fastapi import APIRouter

from ..schemas import MonitoringOverviewResponse

router = APIRouter()


@router.get("/api/monitoring/overview", response_model=MonitoringOverviewResponse)
def monitoring_overview() -> MonitoringOverviewResponse:
    return MonitoringOverviewResponse(
        model="Lab-3D",
        lastUpdated=datetime.now(timezone.utc),
        fps=60,
    )
