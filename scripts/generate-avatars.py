from __future__ import annotations

import os
import struct
import zlib


def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    length = struct.pack(">I", len(data))
    crc = zlib.crc32(chunk_type + data) & 0xFFFFFFFF
    return length + chunk_type + data + struct.pack(">I", crc)


def _write_png(path: str, width: int, height: int, pixel_fn) -> None:
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # no filter
        for x in range(width):
            r, g, b = pixel_fn(x, y)
            raw.extend((r, g, b))

    compressed = zlib.compress(bytes(raw), level=9)
    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    data = b"".join(
        [
            signature,
            _png_chunk(b"IHDR", ihdr),
            _png_chunk(b"IDAT", compressed),
            _png_chunk(b"IEND", b""),
        ]
    )
    with open(path, "wb") as f:
        f.write(data)


def _circle_mask(x: int, y: int, cx: int, cy: int, radius: int) -> bool:
    dx = x - cx
    dy = y - cy
    return dx * dx + dy * dy <= radius * radius


def _avatar_1(width: int, height: int):
    bg = (15, 118, 110)
    face = (153, 246, 228)
    body = (94, 234, 212)
    cx, cy = width // 2, int(height * 0.38)
    face_r = int(width * 0.18)

    def fn(x: int, y: int):
        if _circle_mask(x, y, cx, cy, face_r):
            return face
        if y > int(height * 0.6):
            return body
        return bg

    return fn


def _avatar_2(width: int, height: int):
    bg = (29, 78, 216)
    face = (191, 219, 254)
    body = (147, 197, 253)
    dot = (96, 165, 250)
    cx, cy = width // 2, int(height * 0.38)
    face_r = int(width * 0.16)
    dot_r = int(width * 0.07)

    def fn(x: int, y: int):
        if _circle_mask(x, y, int(width * 0.72), int(height * 0.28), dot_r):
            return dot
        if _circle_mask(x, y, cx, cy, face_r):
            return face
        if y > int(height * 0.62):
            return body
        return bg

    return fn


def _avatar_3(width: int, height: int):
    bg = (124, 45, 18)
    face = (254, 215, 170)
    body = (253, 186, 116)
    banner = (251, 146, 60)
    cx, cy = width // 2, int(height * 0.38)
    face_r = int(width * 0.16)

    def fn(x: int, y: int):
        if 0.28 * height <= y <= 0.36 * height and 0.25 * width <= x <= 0.75 * width:
            return banner
        if _circle_mask(x, y, cx, cy, face_r):
            return face
        if y > int(height * 0.62):
            return body
        return bg

    return fn


def main() -> None:
    width = 1000
    height = 1000
    output_dir = os.path.join(
        os.path.dirname(__file__),
        "..",
        "chemical-sample-dashboard",
        "public",
        "avatars",
    )
    os.makedirs(output_dir, exist_ok=True)

    avatars = [
        ("avatar-1.png", _avatar_1(width, height)),
        ("avatar-2.png", _avatar_2(width, height)),
        ("avatar-3.png", _avatar_3(width, height)),
    ]

    for filename, pixel_fn in avatars:
        path = os.path.join(output_dir, filename)
        _write_png(path, width, height, pixel_fn)


if __name__ == "__main__":
    main()
