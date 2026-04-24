from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="TH Field Intelligence API")
api_router = APIRouter(prefix="/api")


class InsightsRequest(BaseModel):
    payload: Dict[str, Any]
    context_note: Optional[str] = None


class InsightCard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    body: str
    tone: str = "neutral"  # positive | negative | neutral | opportunity
    metric: Optional[str] = None


class InsightsResponse(BaseModel):
    insights: List[InsightCard]
    generated_at: str


@api_router.get("/")
async def root():
    return {"message": "TH Field Intelligence API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy", "llm_key_configured": bool(EMERGENT_LLM_KEY)}


SYSTEM_PROMPT = """You are a seasoned retail business analyst helping a Tommy Hilfiger store intern
analyze consumer research data. You receive aggregated survey data, sales KPIs, dead-hour patterns,
and competitive observations. You return concise, actionable insight cards for an Indian retail context.

RULES:
- Return ONLY valid JSON (no markdown, no code fences, no commentary).
- Schema: {"insights": [{"title": str, "body": str, "tone": "positive|negative|neutral|opportunity", "metric": str or null}]}
- Produce 4 to 6 insights.
- Each title: max 10 words, punchy, specific.
- Each body: 1-2 sentences, 25 words max, grounded in the numbers supplied.
- Mix tones: highlight wins (positive), risks (negative), and opportunities.
- Use Indian context (₹, occasions like weddings/gifting, Indian consumer behaviour).
- Refer to specific numbers from the payload when possible.
- If data is insufficient for a given area, omit that insight rather than speculate."""


@api_router.post("/ai/insights", response_model=InsightsResponse)
async def generate_insights(req: InsightsRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        session_id = f"insights-{uuid.uuid4()}"
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        user_text = (
            "Analyze this Tommy Hilfiger store field data and return insights as JSON:\n\n"
            + json.dumps(req.payload, indent=2, default=str)
        )
        if req.context_note:
            user_text += f"\n\nContext: {req.context_note}"

        response_text = await chat.send_message(UserMessage(text=user_text))

        # Strip fences if model ever leaks them
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()

        parsed = json.loads(cleaned)
        raw_insights = parsed.get("insights", [])
        cards = [
            InsightCard(
                title=str(item.get("title", ""))[:120],
                body=str(item.get("body", ""))[:400],
                tone=item.get("tone", "neutral") or "neutral",
                metric=item.get("metric"),
            )
            for item in raw_insights
            if item.get("title") and item.get("body")
        ]
        return InsightsResponse(
            insights=cards,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
    except json.JSONDecodeError as e:
        logger.exception("LLM JSON parse error")
        raise HTTPException(status_code=502, detail=f"LLM returned non-JSON output: {e}")
    except Exception as e:
        logger.exception("Insight generation failed")
        raise HTTPException(status_code=500, detail=f"Insight generation failed: {e}")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
