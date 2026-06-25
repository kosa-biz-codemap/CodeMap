"""Backward-compatible import path for the Dispatcher node."""

from __future__ import annotations

from app.agent.nodes.dispatcher_node import (
    _ALLOWED_EXTENSIONS,
    _ALLOWED_WORKERS,
    _is_safe_path,
    dispatcher_node,
    fanout_to_workers,
    route_node,
)

__all__ = [
    "_ALLOWED_EXTENSIONS",
    "_ALLOWED_WORKERS",
    "_is_safe_path",
    "dispatcher_node",
    "fanout_to_workers",
    "route_node",
]
