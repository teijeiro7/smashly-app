#!/usr/bin/env python3
"""Genera un vídeo de Smashly con Veo 3.1 y lo descarga.

Requisitos:
    pip install google-genai
    export GEMINI_API_KEY=...

Uso:
    # text-to-video
    python generate_video.py --prompt-file prompt.txt --out ad-a1.mp4

    # image-to-video (demo de UI a partir de un screenshot vertical)
    python generate_video.py --prompt-file motion.txt --image ../../screenshots/04-catalog-mobile.png --out demo-catalog.mp4

    # serie con personaje consistente
    python generate_video.py --prompt-file d1.txt --seed 424242 --out ugc-marcos-01.mp4

Recuerda: los vídeos se borran del servidor a los 2 días.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

from google import genai
from google.genai import types

MODEL = "veo-3.1-generate-preview"
POLL_SECONDS = 10
MAX_WAIT_SECONDS = 420  # la doc admite hasta 6 min en horas punta


def build_config(args: argparse.Namespace) -> types.GenerateVideosConfig:
    kwargs: dict = {
        "aspect_ratio": args.aspect_ratio,
        "duration_seconds": args.duration,
        "resolution": args.resolution,
        # En España (UE) solo se admite allow_adult para image-to-video,
        # interpolación y reference images.
        "person_generation": args.person_generation,
        "number_of_videos": 1,
    }
    if args.seed is not None:
        kwargs["seed"] = args.seed
    if args.negative_prompt:
        kwargs["negative_prompt"] = args.negative_prompt
    if args.last_frame:
        kwargs["last_frame"] = types.Image.from_file(location=args.last_frame)
    return types.GenerateVideosConfig(**kwargs)


def validate(args: argparse.Namespace) -> None:
    if args.resolution in ("1080p", "4k") and args.duration != "8":
        sys.exit("Error: 1080p y 4k exigen duration_seconds='8'.")
    if args.last_frame and not args.image:
        sys.exit("Error: --last-frame requiere --image.")
    if args.reference_images and len(args.reference_images) > 3:
        sys.exit("Error: máximo 3 reference images.")
    if args.reference_images and args.duration != "8":
        sys.exit("Error: usar reference images exige duration_seconds='8'.")


def main() -> None:
    p = argparse.ArgumentParser(description="Genera vídeo con Veo 3.1")
    p.add_argument("--prompt-file", required=True, help="Fichero de texto con el prompt")
    p.add_argument("--out", required=True, help="Ruta del .mp4 de salida")
    p.add_argument("--image", help="Frame inicial (image-to-video)")
    p.add_argument("--last-frame", help="Frame final (interpolación). Requiere --image")
    p.add_argument(
        "--reference-images",
        nargs="*",
        default=[],
        help="Hasta 3 imágenes de referencia (referenceType='asset')",
    )
    p.add_argument("--aspect-ratio", default="9:16", choices=["9:16", "16:9"])
    p.add_argument("--duration", default="8", choices=["4", "6", "8"])
    p.add_argument("--resolution", default="1080p", choices=["720p", "1080p", "4k"])
    p.add_argument(
        "--person-generation", default="allow_adult", choices=["allow_adult", "allow_all"]
    )
    p.add_argument("--negative-prompt")
    p.add_argument("--seed", type=int, help="Mismo seed = más consistencia en una serie")
    args = p.parse_args()

    validate(args)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit("Error: falta la variable de entorno GEMINI_API_KEY.")

    prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    client = genai.Client(api_key=api_key)

    call_kwargs: dict = {"model": MODEL, "prompt": prompt, "config": build_config(args)}

    # OJO: la imagen inicial va como argumento primario, NO dentro de config.
    if args.image:
        call_kwargs["image"] = types.Image.from_file(location=args.image)

    if args.reference_images:
        call_kwargs["config"].reference_images = [
            types.VideoGenerationReferenceImage(
                image=types.Image.from_file(location=path),
                reference_type="asset",
            )
            for path in args.reference_images
        ]

    print(f"Lanzando generación con {MODEL}…")
    operation = client.models.generate_videos(**call_kwargs)

    waited = 0
    while not operation.done:
        if waited >= MAX_WAIT_SECONDS:
            sys.exit(f"Timeout tras {waited}s. Operación: {operation.name}")
        time.sleep(POLL_SECONDS)
        waited += POLL_SECONDS
        operation = client.operations.get(operation)
        print(f"  … {waited}s")

    video = operation.response.generated_videos[0].video
    client.files.download(file=video)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    video.save(str(out))
    print(f"Listo: {out} ({waited}s)")


if __name__ == "__main__":
    main()
