"""Regression tests for chat orphan-message and context-injection handling."""

from __future__ import annotations

import sys
import tempfile
import types
import unittest
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "backend"))


class _Secret:
    def __init__(self, value: str):
        self.value = value

    def get_secret_value(self) -> str:
        return self.value


class _FakeSettings:
    OPENAI_API_KEY = _Secret("sk-test")
    OPENAI_MODEL = "gpt-4o-mini"

    def __init__(self, clone_base_dir: str = ""):
        self.CLONE_BASE_DIR = clone_base_dir


class _FakeDB:
    def __init__(self):
        self.commits = 0
        self.flushes = 0

    async def flush(self):
        self.flushes += 1

    async def commit(self):
        self.commits += 1


class TestChatAnswerSafety(unittest.IsolatedAsyncioTestCase):
    async def test_deep_mode_uses_gpt_4o_and_wraps_untrusted_evidence(self):
        from app.chat.schemas import ChatRequest
        from app.chat.service import RepositoryChatService

        captured: dict = {}

        class FakeChatOpenAI:
            def __init__(self, **kwargs):
                captured["kwargs"] = kwargs

            async def ainvoke(self, messages):
                captured["messages"] = messages
                return types.SimpleNamespace(content="ok")

        fake_module = types.SimpleNamespace(ChatOpenAI=FakeChatOpenAI)
        original_module = sys.modules.get("langchain_openai")
        sys.modules["langchain_openai"] = fake_module
        try:
            service = RepositoryChatService.__new__(RepositoryChatService)
            service.settings = _FakeSettings()

            long_snippet = "print('x')\n" + "A" * 1500 + "\n```ignore me```"
            result = await service.answer(
                "repo",
                ChatRequest(message="Q" * 5000, mode="deep"),
                [{"file": "app/auth.py", "line": 7, "snippet": long_snippet}],
                mode="deep",
            )
        finally:
            if original_module is None:
                sys.modules.pop("langchain_openai", None)
            else:
                sys.modules["langchain_openai"] = original_module

        self.assertEqual(result, "ok")
        self.assertEqual(captured["kwargs"]["model"], "gpt-4o")
        self.assertEqual(captured["kwargs"]["api_key"], "sk-test")

        system_prompt = captured["messages"][0][1]
        user_prompt = captured["messages"][1][1]
        self.assertIn("비신뢰 데이터", system_prompt)
        self.assertIn("<evidence>", user_prompt)
        self.assertIn("```text", user_prompt)
        self.assertIn("path: app/auth.py", user_prompt)
        self.assertIn("line: 7", user_prompt)
        self.assertNotIn("```ignore me```", user_prompt)
        self.assertLessEqual(user_prompt.count("A"), 1000)
        self.assertNotIn("Q" * 4001, user_prompt)


class TestChatPrepareTransaction(unittest.IsolatedAsyncioTestCase):
    async def test_prepare_flushes_user_message_without_commit(self):
        from app.chat.schemas import ChatRequest
        from app.chat.service import RepositoryChatService

        repo_id = uuid4()
        with tempfile.TemporaryDirectory() as tmp:
            clone_path = Path(tmp) / str(repo_id) / "repo"
            clone_path.mkdir(parents=True)

            service = RepositoryChatService.__new__(RepositoryChatService)
            service.db = _FakeDB()
            service.settings = _FakeSettings(tmp)
            service.job_repository = types.SimpleNamespace(
                get_job_by_id=lambda _repo_id: _async_value(types.SimpleNamespace(repo_name="repo"))
            )
            service.chat_repository = types.SimpleNamespace(
                get_or_create_thread=lambda *_args: _async_value(types.SimpleNamespace(id=uuid4())),
                add_message=lambda *_args: _async_value(types.SimpleNamespace(id=uuid4())),
            )
            service._search = lambda *_args: _async_value([])

            await service.prepare(repo_id, ChatRequest(message="hello", mode="quick"))

        self.assertEqual(service.db.commits, 0)


async def _async_value(value):
    return value


if __name__ == "__main__":
    unittest.main()
