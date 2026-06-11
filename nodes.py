import hashlib
import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import comfy.sd
import comfy.utils
import folder_paths

try:
    from aiohttp import web
    from server import PromptServer
except Exception:
    web = None
    PromptServer = None


THUMBNAIL_DIR = "lora_visual_selector"
PROMPT_STORE_FILE = "lora_prompts.json"
MAX_UPLOAD_BYTES = 24 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
MAX_PROMPT_CHARS = 8000


def _safe_label(name: str) -> str:
    base = os.path.splitext(os.path.basename(name))[0]
    base = re.sub(r"[^a-zA-Z0-9._-]+", "_", base).strip("._")
    return base[:80] or "lora"


def _lora_id(name: str) -> str:
    return hashlib.sha256(name.encode("utf-8")).hexdigest()[:24]


def _extension_root() -> str:
    return os.path.dirname(os.path.realpath(__file__))


def _thumbnail_root() -> str:
    path = os.path.join(_extension_root(), "thumbnails", THUMBNAIL_DIR)
    os.makedirs(path, exist_ok=True)
    return path


def _prompt_store_path() -> str:
    path = os.path.join(_extension_root(), "metadata")
    os.makedirs(path, exist_ok=True)
    return os.path.join(path, PROMPT_STORE_FILE)


def _read_prompt_store() -> Dict[str, str]:
    path = _prompt_store_path()
    if not os.path.exists(path):
        return {}

    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return {}

    if not isinstance(data, dict):
        return {}

    prompts = {}
    for name, prompt in data.items():
        if isinstance(name, str) and isinstance(prompt, str):
            prompts[name] = prompt[:MAX_PROMPT_CHARS]
    return prompts


def _write_prompt_store(prompts: Dict[str, str]) -> None:
    path = _prompt_store_path()
    tmp_path = f"{path}.tmp"
    clean_prompts = {
        str(name): str(prompt)[:MAX_PROMPT_CHARS]
        for name, prompt in prompts.items()
        if str(name).strip() and str(prompt).strip()
    }
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(clean_prompts, handle, ensure_ascii=False, indent=2, sort_keys=True)
    os.replace(tmp_path, path)


def _thumbnail_path(name: str, extension: str) -> str:
    extension = extension.lower()
    if extension == ".jpeg":
        extension = ".jpg"
    return os.path.join(_thumbnail_root(), f"{_lora_id(name)}__{_safe_label(name)}{extension}")


def _find_thumbnail(name_or_id: str) -> Optional[str]:
    root = _thumbnail_root()
    prefix = _lora_id(name_or_id)
    if re.fullmatch(r"[a-f0-9]{24}", name_or_id):
        prefix = name_or_id

    for entry in os.listdir(root):
        lower = entry.lower()
        if entry.startswith(prefix + "__") and os.path.splitext(lower)[1] in ALLOWED_IMAGE_EXTENSIONS:
            return os.path.join(root, entry)
    return None


def _delete_old_thumbnails(name: str) -> None:
    root = _thumbnail_root()
    prefix = _lora_id(name)
    for entry in os.listdir(root):
        if entry.startswith(prefix + "__"):
            try:
                os.remove(os.path.join(root, entry))
            except OSError:
                pass


def _list_loras() -> List[str]:
    try:
        return sorted(folder_paths.get_filename_list("loras"), key=lambda item: item.lower())
    except Exception:
        return []


def _parse_selected_loras(raw: Any) -> List[Dict[str, Any]]:
    if raw is None:
        return []
    if isinstance(raw, str):
        raw = raw.strip()
        if not raw:
            return []
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            raw = [part.strip() for part in raw.split(",") if part.strip()]

    if not isinstance(raw, list):
        return []

    selected = []
    seen = set()
    for item in raw:
        if isinstance(item, str):
            entry = {"name": item}
        elif isinstance(item, dict):
            entry = dict(item)
        else:
            continue

        name = str(entry.get("name", "")).strip()
        if not name or name in seen:
            continue
        seen.add(name)
        entry["name"] = name
        selected.append(entry)
    return selected


class LoraVisualSelector:
    _lora_cache: Dict[Tuple[str, float], Dict[str, Any]] = {}

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model": ("MODEL",),
                "clip": ("CLIP",),
                "selected_loras": ("STRING", {"default": "[]", "multiline": True}),
                "strength_model": (
                    "FLOAT",
                    {"default": 0.85, "min": -20.0, "max": 20.0, "step": 0.01},
                ),
                "strength_clip": (
                    "FLOAT",
                    {"default": 1.0, "min": -20.0, "max": 20.0, "step": 0.01},
                ),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "STRING", "STRING")
    RETURN_NAMES = ("model", "clip", "lora_name", "lora_prompt")
    OUTPUT_IS_LIST = (True, True, True, True)
    FUNCTION = "load_selected_loras"
    CATEGORY = "loaders/lora"

    @classmethod
    def IS_CHANGED(cls, selected_loras, strength_model, strength_clip, **kwargs):
        return json.dumps(
            {
                "selected_loras": selected_loras,
                "strength_model": strength_model,
                "strength_clip": strength_clip,
            },
            sort_keys=True,
        )

    def _load_lora_file(self, lora_name: str) -> Dict[str, Any]:
        lora_path = folder_paths.get_full_path_or_raise("loras", lora_name)
        mtime = os.path.getmtime(lora_path)
        cache_key = (lora_path, mtime)
        cached = self._lora_cache.get(cache_key)
        if cached is not None:
            return cached

        lora = comfy.utils.load_torch_file(lora_path, safe_load=True)
        self._lora_cache = {cache_key: lora}
        return lora

    def load_selected_loras(
        self,
        model,
        clip,
        selected_loras,
        strength_model,
        strength_clip,
    ):
        available = set(_list_loras())
        selected = [entry for entry in _parse_selected_loras(selected_loras) if entry["name"] in available]

        if not selected:
            return ([model], [clip], [""], [""])

        models = []
        clips = []
        names = []
        prompts = []

        for entry in selected:
            name = entry["name"]
            model_strength = float(entry.get("strength_model", strength_model))
            clip_strength = float(entry.get("strength_clip", strength_clip))
            prompt = str(entry.get("prompt", "")).strip()

            if model_strength == 0 and clip_strength == 0:
                patched_model, patched_clip = model, clip
            else:
                lora = self._load_lora_file(name)
                patched_model, patched_clip = comfy.sd.load_lora_for_models(
                    model,
                    clip,
                    lora,
                    model_strength,
                    clip_strength,
                )

            models.append(patched_model)
            clips.append(patched_clip)
            names.append(name)
            prompts.append(prompt)

        return (models, clips, names, prompts)


async def _handle_lora_list(request):
    items = []
    prompts = _read_prompt_store()
    for name in _list_loras():
        thumb = _find_thumbnail(name)
        lora_id = _lora_id(name)
        items.append(
            {
                "id": lora_id,
                "name": name,
                "label": os.path.splitext(os.path.basename(name))[0],
                "prompt": prompts.get(name, ""),
                "thumbnail": f"/lora_visual_selector/thumbnail/{lora_id}" if thumb else None,
            }
        )
    return web.json_response({"items": items})


async def _handle_lora_thumbnail(request):
    lora_id = request.match_info.get("lora_id", "")
    if not re.fullmatch(r"[a-f0-9]{24}", lora_id):
        return web.Response(status=404)

    path = _find_thumbnail(lora_id)
    if not path or not os.path.exists(path):
        return web.Response(status=404)
    return web.FileResponse(path)


async def _handle_lora_upload(request):
    reader = await request.multipart()
    lora_name = None
    image_bytes = None
    extension = ".png"

    async for field in reader:
        if field.name == "lora_name":
            lora_name = (await field.text()).strip()
        elif field.name == "image":
            filename = field.filename or ""
            ext = os.path.splitext(filename)[1].lower()
            if ext in ALLOWED_IMAGE_EXTENSIONS:
                extension = ".jpg" if ext == ".jpeg" else ext

            chunks = []
            total = 0
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_UPLOAD_BYTES:
                    return web.json_response({"error": "Image is too large."}, status=413)
                chunks.append(chunk)
            image_bytes = b"".join(chunks)

    if not lora_name or lora_name not in set(_list_loras()):
        return web.json_response({"error": "Unknown LoRA."}, status=400)
    if not image_bytes:
        return web.json_response({"error": "No image uploaded."}, status=400)

    _delete_old_thumbnails(lora_name)
    path = _thumbnail_path(lora_name, extension)
    with open(path, "wb") as handle:
        handle.write(image_bytes)

    lora_id = _lora_id(lora_name)
    return web.json_response({"thumbnail": f"/lora_visual_selector/thumbnail/{lora_id}", "id": lora_id})


async def _handle_lora_prompt(request):
    try:
        payload = await request.json()
    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON."}, status=400)

    lora_name = str(payload.get("lora_name", "")).strip() if isinstance(payload, dict) else ""
    prompt = str(payload.get("prompt", "")) if isinstance(payload, dict) else ""

    if not lora_name or lora_name not in set(_list_loras()):
        return web.json_response({"error": "Unknown LoRA."}, status=400)
    if len(prompt) > MAX_PROMPT_CHARS:
        return web.json_response({"error": f"Prompt is too long. Max {MAX_PROMPT_CHARS} characters."}, status=413)

    prompts = _read_prompt_store()
    prompt = prompt.strip()
    if prompt:
        prompts[lora_name] = prompt
    else:
        prompts.pop(lora_name, None)
    _write_prompt_store(prompts)

    return web.json_response({"name": lora_name, "prompt": prompt})


if PromptServer is not None and web is not None:
    routes = PromptServer.instance.routes
    routes.get("/lora_visual_selector/list")(_handle_lora_list)
    routes.get("/lora_visual_selector/thumbnail/{lora_id}")(_handle_lora_thumbnail)
    routes.post("/lora_visual_selector/upload")(_handle_lora_upload)
    routes.post("/lora_visual_selector/prompt")(_handle_lora_prompt)


NODE_CLASS_MAPPINGS = {
    "LoraVisualSelector": LoraVisualSelector,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LoraVisualSelector": "LoRA Visual Selector",
}
