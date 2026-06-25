"""Tool router contract tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "backend"))


class TestToolRouter(unittest.TestCase):
    def _client(self) -> TestClient:
        from app.infra.database import get_db
        from app.tool.router import router

        app = FastAPI()

        async def fake_db():
            yield object()

        app.dependency_overrides[get_db] = fake_db
        app.include_router(router)
        return TestClient(app)

    def test_execute_tool_accepts_single_json_body_and_returns_501(self):
        response = self._client().post(
            "/tools/execute",
            json={
                "tool_name": "vector_search",
                "arguments": {"query": "login"},
                "job_id": "job-1",
                "run_id": "run-1",
            },
        )

        self.assertEqual(response.status_code, 501)
        self.assertEqual(response.json()["status"], "failed")
        self.assertEqual(response.json()["message"], "not_implemented")

    def test_execute_tool_requires_tool_name_and_arguments(self):
        response = self._client().post("/tools/execute", json={"tool_name": "vector_search"})

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
