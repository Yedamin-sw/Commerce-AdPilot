import json
import os
from pathlib import Path
from typing import Any, Dict, List

PROMPT_FILE = Path(__file__).resolve().parents[2] / "prompt" / "commerce-adpilot-multichannel.prompt.json"


def _require_api_key() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY not set in environment")


def _create_client() -> Any:
    from openai import AsyncOpenAI

    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _load_prompt_template() -> Dict[str, Any]:
    if not PROMPT_FILE.exists():
        raise FileNotFoundError(f"Prompt file not found: {PROMPT_FILE}")

    with PROMPT_FILE.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def build_messages(input_json: Dict[str, Any]) -> List[Dict[str, str]]:
    template = _load_prompt_template()
    messages = template.get("openai_request_template", {}).get("messages", [])
    payload_text = json.dumps(input_json, ensure_ascii=False)

    built_messages: List[Dict[str, str]] = []
    for message in messages:
        role = message.get("role")
        content = message.get("content", "")

        if role == "user":
            content = content.replace("{{INPUT_JSON}}", payload_text) if "{{INPUT_JSON}}" in content else payload_text

        built_messages.append({"role": role, "content": content})

    return built_messages


async def generate_multichannel_copy(input_json: Dict[str, Any]) -> Dict[str, Any]:
    _require_api_key()
    client = _create_client()

    template = _load_prompt_template()
    openai_request = template.get("openai_request_template", {})
    request_kwargs: Dict[str, Any] = {
        "model": openai_request["model"],
        "messages": build_messages(input_json),
        "temperature": openai_request.get("temperature", 0),
        "top_p": openai_request.get("top_p", 1),
    }

    response_format = openai_request.get("response_format")
    if response_format:
        request_kwargs["response_format"] = response_format

    response = await client.chat.completions.create(**request_kwargs)
    content = response.choices[0].message.content or ""

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {"raw": content}


async def generate_ad(prompt: str):
    _require_api_key()
    client = _create_client()

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
    )
    return True, response.choices[0].message.content