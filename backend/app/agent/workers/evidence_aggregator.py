"""Backward-compatible import path for the Evaluator node."""

from __future__ import annotations

from app.agent.nodes.evaluator_node import _deduplicate, evaluator_node, evidence_aggregator

__all__ = ["_deduplicate", "evaluator_node", "evidence_aggregator"]
