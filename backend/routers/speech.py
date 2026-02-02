import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/speech", tags=["speech"])


class SpeechTokenResponse(BaseModel):
    token: str
    region: str


@router.get("/token", response_model=SpeechTokenResponse)
async def get_speech_token():
    """
    Azure Speech 서비스용 인증 토큰을 발급합니다.
    토큰은 10분간 유효합니다.
    """
    speech_key = os.getenv("AZURE_SPEECH_KEY")
    speech_region = os.getenv("AZURE_SPEECH_REGION", "eastus")

    if not speech_key:
        raise HTTPException(
            status_code=503,
            detail="Speech service not configured"
        )

    token_url = f"https://{speech_region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                headers={
                    "Ocp-Apim-Subscription-Key": speech_key,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            token = response.text

        return SpeechTokenResponse(token=token, region=speech_region)

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to get speech token: {e.response.status_code}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Speech service connection error: {str(e)}"
        )
