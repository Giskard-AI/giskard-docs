import os
import pytest


def pytest_collection_modifyitems(config, items):
    """Auto-skip requires_api tests when OPENAI_API_KEY is not set."""
    if os.environ.get("OPENAI_API_KEY"):
        return
    skip = pytest.mark.skip(reason="OPENAI_API_KEY not set")
    for item in items:
        if item.get_closest_marker("requires_api"):
            item.add_marker(skip)
