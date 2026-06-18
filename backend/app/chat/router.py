import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.repository import ChatRepository
from app.chat.schemas import ChatRequest
from app.chat.service import RepositoryChatService
from app.core.database import get_db


router = APIRouter(prefix="/api/chat", tags=["Repository Chat"])


def _event(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.post("/{repo_id}")
async def chat(repo_id: UUID, request: ChatRequest, db: AsyncSession = Depends(get_db)):
    service = RepositoryChatService(db)
    try:
        job, thread, mode, references = await service.prepare(repo_id, request)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async def stream():
        yield _event({"type": "thread", "threadId": str(thread.id)})
        yield _event({"type": "status", "phase": "searching"})
        for item in references:
            yield _event({"type": "exploration", "step": f"{item['file']}:{item['line']} 확인"})
        yield _event({"type": "status", "phase": "building_context"})
        answer = await service.answer(job.repo_name, request, references)
        yield _event({"type": "status", "phase": "generating"})
        for index in range(0, len(answer), 36):
            yield _event({"type": "content", "content": answer[index:index + 36]})
            await asyncio.sleep(0.01)
        yield _event({"type": "references", "references": references})
        await service.persist_answer(thread, answer, mode, references)
        yield _event({"type": "done"})

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@router.get("/{repo_id}/threads")
async def list_threads(repo_id: UUID, db: AsyncSession = Depends(get_db)):
    threads = await ChatRepository(db).list_threads(repo_id)
    return {"items": [{
        "id": str(item.id), "repoId": str(item.repo_id), "title": item.title,
        "createdAt": item.created_at.isoformat(), "updatedAt": item.updated_at.isoformat(),
    } for item in threads]}


@router.get("/{repo_id}/threads/{thread_id}")
async def get_thread(repo_id: UUID, thread_id: UUID, db: AsyncSession = Depends(get_db)):
    messages = await ChatRepository(db).list_messages(repo_id, thread_id)
    return {"items": [{
        "id": str(item.id), "role": item.role, "content": item.content, "mode": item.mode,
        "references": item.references, "createdAt": item.created_at.isoformat(),
    } for item in messages]}
