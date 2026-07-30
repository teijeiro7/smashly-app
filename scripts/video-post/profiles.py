"""Perfiles de exportación por plataforma.

Los límites de duración y tamaño son los de las plataformas; si el render los
supera, `check()` lo avisa antes de gastar tiempo de encoding.

A diferencia de un `scale=W:H` a pelo, aquí el ajuste es **cover + crop centrado**
(o `pad` si se pide), así que el material nunca se deforma.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Profile:
    name: str
    width: int
    height: int
    fps: int
    crf: int
    max_seconds: int | None = None
    max_mb: int | None = None
    audio_bitrate: str = "192k"

    @property
    def aspect(self) -> str:
        from math import gcd

        g = gcd(self.width, self.height)
        return f"{self.width // g}:{self.height // g}"

    def video_filter(self, fit: str = "crop", bias: float = 0.5) -> str:
        """Cadena de filtros que lleva cualquier entrada a WxH sin deformarla.

        fit="crop": escala para cubrir y recorta. Es lo que quieres casi siempre.
        fit="pad":  escala para caber y rellena con negro. Para no perder encuadre.
        bias:       0.0 = recorta pegado al borde superior/izquierdo,
                    0.5 = centrado, 1.0 = pegado al inferior/derecho.
                    Con caras, 0.35 suele ir mejor que 0.5.
        """
        w, h = self.width, self.height
        if fit == "pad":
            return (
                f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
                f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,"
                f"setsar=1,fps={self.fps}"
            )
        # cover + crop
        return (
            f"scale={w}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h}:(iw-{w})*{bias}:(ih-{h})*{bias},"
            f"setsar=1,fps={self.fps}"
        )

    def check(self, duration: float, size_mb: float | None = None) -> list[str]:
        warns: list[str] = []
        if self.max_seconds and duration > self.max_seconds:
            warns.append(
                f"{self.name}: {duration:.1f}s supera el máximo de {self.max_seconds}s"
            )
        if self.max_mb and size_mb and size_mb > self.max_mb:
            warns.append(
                f"{self.name}: {size_mb:.0f} MB supera el máximo de {self.max_mb} MB"
            )
        return warns


PROFILES: dict[str, Profile] = {
    # Verticales — el formato principal de Smashly
    "tiktok": Profile("tiktok", 1080, 1920, 30, 20, max_seconds=600, max_mb=287),
    "reels": Profile("reels", 1080, 1920, 30, 20, max_seconds=90, max_mb=250),
    "shorts": Profile("shorts", 1080, 1920, 30, 20, max_seconds=180),
    # Feed
    "ig_feed": Profile("ig_feed", 1080, 1080, 30, 20, max_seconds=60, max_mb=250),
    "ig_4x5": Profile("ig_4x5", 1080, 1350, 30, 20, max_seconds=60, max_mb=250),
    # Horizontales
    "youtube": Profile("youtube", 1920, 1080, 30, 18),
    "linkedin": Profile("linkedin", 1920, 1080, 30, 20, max_seconds=600, max_mb=5120),
    "x": Profile("x", 1920, 1080, 30, 20, max_seconds=140, max_mb=512),
}

# Presets de conjunto: lo que se exporta de una tacada
BUNDLES: dict[str, list[str]] = {
    "vertical": ["tiktok", "reels", "shorts"],
    "social": ["tiktok", "reels", "shorts", "ig_4x5", "ig_feed"],
    "all": list(PROFILES),
}


def resolve(names: list[str]) -> list[Profile]:
    """Acepta nombres de perfil y de bundle, mezclados, sin duplicar."""
    out: list[Profile] = []
    seen: set[str] = set()
    for n in names:
        keys = BUNDLES.get(n, [n])
        for k in keys:
            if k in seen:
                continue
            if k not in PROFILES:
                raise SystemExit(
                    f"Perfil desconocido: {k}\n"
                    f"Perfiles: {', '.join(PROFILES)}\n"
                    f"Bundles:  {', '.join(BUNDLES)}"
                )
            seen.add(k)
            out.append(PROFILES[k])
    return out
