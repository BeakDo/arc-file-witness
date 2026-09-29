from pathlib import Path

from PIL import Image, ImageDraw


SIZE = 480
SCALE = 3
INK = "#14243A"
PAPER = "#F7F4ED"
ACCENT = "#F6A84B"
MUTED = "#9BC1CC"

image = Image.new("RGB", (SIZE * SCALE, SIZE * SCALE), INK)
draw = ImageDraw.Draw(image)


def box(coords):
    return tuple(round(value * SCALE) for value in coords)


# A file outline, a non-text fingerprint, and a small timestamp dial.
draw.rounded_rectangle(box((101, 72, 353, 390)), radius=30 * SCALE, fill=PAPER)
draw.polygon(
    [(round(x * SCALE), round(y * SCALE)) for x, y in [(291, 72), (353, 134), (291, 134)]],
    fill=INK,
)
draw.line(
    [(round(x * SCALE), round(y * SCALE)) for x, y in [(291, 73), (291, 134), (352, 134)]],
    fill=MUTED,
    width=5 * SCALE,
)

fingerprint = [
    "1011010",
    "0110101",
    "1101100",
    "0010111",
    "1011001",
]
for row, pattern in enumerate(fingerprint):
    for col, bit in enumerate(pattern):
        if bit == "1":
            x = 137 + col * 25
            y = 180 + row * 25
            draw.rounded_rectangle(box((x, y, x + 16, y + 16)), radius=4 * SCALE, fill=INK)

draw.ellipse(box((293, 284, 408, 399)), fill=ACCENT, outline=INK, width=9 * SCALE)
draw.line(
    [(round(x * SCALE), round(y * SCALE)) for x, y in [(350, 311), (350, 343), (373, 356)]],
    fill=INK,
    width=10 * SCALE,
    joint="curve",
)
draw.ellipse(box((342, 336, 358, 352)), fill=INK)

output = Path(__file__).resolve().parents[1] / "assets" / "buidl-logo.png"
output.parent.mkdir(parents=True, exist_ok=True)
image.resize((SIZE, SIZE), Image.Resampling.LANCZOS).save(output, optimize=True)
print(output)
