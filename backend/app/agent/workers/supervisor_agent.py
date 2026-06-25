"""Backward-compatible import path for the Planner node."""

from __future__ import annotations

from app.agent.nodes.planner_node import planner_node, supervisor_node

__all__ = ["planner_node", "supervisor_node"]
