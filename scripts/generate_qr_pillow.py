import os
import json
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

TARGET_URL = sys.argv[1] if len(sys.argv) > 1 else "http://192.168.29.91:5173/"
print(f"Generating QR codes for: {TARGET_URL}")

# 1. Fetch exact QR matrix from verified Nayuki generator
node_cmd = f'''
import {{ generateQRMatrix }} from "./src/lib/qrCode.js";
const {{ matrix, count }} = generateQRMatrix("{TARGET_URL}", "M");
console.log(JSON.stringify({{ matrix, count }}));
'''

res = subprocess.run(["node", "-e", node_cmd], capture_output=True, text=True, check=True)
data = json.loads(res.stdout)
matrix = data["matrix"]
count = data["count"]

artifact_dir = "/Users/alishaanjum/.gemini/antigravity/brain/802f035e-186c-49f2-996d-3ac6f7bd75c8"
public_dir = "/Users/alishaanjum/Desktop/Nischay/CineBite/public/images"
workspace_dir = "/Users/alishaanjum/Desktop/Nischay/CineBite"

os.makedirs(public_dir, exist_ok=True)

# -------------------------------------------------------------------------
# GENERATE 1: Pure Standalone QR (660 x 660 px)
# -------------------------------------------------------------------------
margin = 4
scale = 20
total_cells = count + margin * 2
pure_size = total_cells * scale

pure_img = Image.new("RGB", (pure_size, pure_size), color=(255, 255, 255))
pure_draw = ImageDraw.Draw(pure_img)

for r in range(count):
    for c in range(count):
        if matrix[r][c]:
            x0 = (c + margin) * scale
            y0 = (r + margin) * scale
            x1 = x0 + scale
            y1 = y0 + scale
            pure_draw.rectangle([x0, y0, x1 - 1, y1 - 1], fill=(0, 0, 0))

pure_paths = [
    os.path.join(artifact_dir, "cinebite_pure_qr.png"),
    os.path.join(public_dir, "cinebite_pure_qr.png"),
    os.path.join(workspace_dir, "cinebite_pure_qr.png")
]
for p in pure_paths:
    pure_img.save(p)
print(f"Saved Pure QR ({pure_size}x{pure_size}) to:")
for p in pure_paths:
    print(f"  - {p}")

# -------------------------------------------------------------------------
# GENERATE 2: Full Cinema Standee (800 x 1060 px)
# -------------------------------------------------------------------------
standee_w, standee_h = 800, 1060
standee = Image.new("RGB", (standee_w, standee_h), color=(10, 12, 18))
draw = ImageDraw.Draw(standee)

# Gradients and outer accents
# Outer border
draw.rounded_rectangle([20, 20, standee_w - 20, standee_h - 20], radius=24, outline=(229, 9, 20), width=2)
draw.rounded_rectangle([26, 26, standee_w - 26, standee_h - 26], radius=20, outline=(255, 255, 255, 30), width=1)

# Inner acrylic card
card_rect = [46, 46, standee_w - 46, standee_h - 46]
draw.rounded_rectangle(card_rect, radius=20, fill=(16, 18, 27), outline=(229, 9, 20), width=2)

# Load fonts
font_helvetica = "/System/Library/Fonts/Helvetica.ttc"
font_arial = "/System/Library/Fonts/Supplemental/Arial.ttf"

def get_font(size, bold=True):
    try:
        fpath = font_helvetica if os.path.exists(font_helvetica) else font_arial
        return ImageFont.truetype(fpath, size, index=1 if bold and "ttc" in fpath else 0)
    except:
        return ImageFont.load_default()

font_brand = get_font(44, bold=True)
font_tm = get_font(18, bold=True)
font_tag = get_font(13, bold=True)
font_cta = get_font(18, bold=True)
font_sub = get_font(14, bold=False)
font_url = get_font(12, bold=True)

# 1. Popcorn Circle Badge (x=400, y=95)
draw.ellipse([400 - 28, 95 - 28, 400 + 28, 95 + 28], fill=(229, 9, 20), outline=(255, 255, 255), width=2)
# Draw cinema star / icon
draw.polygon([(400, 80), (405, 92), (418, 92), (408, 100), (412, 112), (400, 104), (388, 112), (392, 100), (382, 92), (395, 92)], fill=(255, 255, 255))

# 2. Brand Name: "CINE" in white, "BITE" in Netflix red, "TM" in gold
cine_text = "CINE"
bite_text = "BITE"
tm_text = "™"

# Measure text positions
cine_bbox = draw.textbbox((0, 0), cine_text, font=font_brand)
bite_bbox = draw.textbbox((0, 0), bite_text, font=font_brand)
cine_w = cine_bbox[2] - cine_bbox[0]
bite_w = bite_bbox[2] - bite_bbox[0]
total_brand_w = cine_w + bite_w

brand_x = 400 - (total_brand_w // 2)
brand_y = 138

draw.text((brand_x, brand_y), cine_text, fill=(255, 255, 255), font=font_brand)
draw.text((brand_x + cine_w + 2, brand_y), bite_text, fill=(229, 9, 20), font=font_brand)
draw.text((brand_x + total_brand_w + 6, brand_y + 4), tm_text, fill=(255, 159, 28), font=font_tm)

# Tagline
tagline = "IN-SEAT CINEMA DINING"
tag_bbox = draw.textbbox((0, 0), tagline, font=font_tag)
tag_w = tag_bbox[2] - tag_bbox[0]
draw.text((400 - tag_w // 2, 192), tagline, fill=(255, 159, 28), font=font_tag)

# 3. White QR Card (Centered at x=120, y=225, size=560x560)
qr_box_x = 120
qr_box_y = 225
qr_box_w = 560
draw.rounded_rectangle([qr_box_x, qr_box_y, qr_box_x + qr_box_w, qr_box_y + qr_box_w], radius=18, fill=(255, 255, 255))

# Draw QR modules inside the white card
# Total modules = count + margin * 2 = 25 + 8 = 33
# Cell size = 560 / 33 = 16.969px -> to be 100% integer sharp:
# Let qr_module_size = 16px, total_inner = 33 * 16 = 528px
# Offset inside 560 box = (560 - 528) // 2 = 16px!
module_px = 16
inner_margin = (qr_box_w - (count + margin * 2) * module_px) // 2

for r in range(count):
    for c in range(count):
        if matrix[r][c]:
            x0 = qr_box_x + inner_margin + (c + margin) * module_px
            y0 = qr_box_y + inner_margin + (r + margin) * module_px
            x1 = x0 + module_px
            y1 = y0 + module_px
            draw.rectangle([x0, y0, x1 - 1, y1 - 1], fill=(0, 0, 0))

# 4. CTA Ribbon: "SCAN TO ORDER FROM YOUR PHONE"
cta_y = 825
cta_w = 480
cta_h = 46
cta_x = 400 - cta_w // 2
draw.rounded_rectangle([cta_x, cta_y, cta_x + cta_w, cta_y + cta_h], radius=23, fill=(229, 9, 20))

cta_text = "SCAN TO ORDER FROM YOUR PHONE"
cta_bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
cta_text_w = cta_bbox[2] - cta_bbox[0]
draw.text((400 - cta_text_w // 2, cta_y + 12), cta_text, fill=(255, 255, 255), font=font_cta)

# Sub-instructions
sub1 = "Point any Phone Camera (iPhone / Android) at this QR Code"
sub1_bbox = draw.textbbox((0, 0), sub1, font=font_sub)
draw.text((400 - (sub1_bbox[2] - sub1_bbox[0]) // 2, 890), sub1, fill=(226, 232, 240), font=font_sub)

sub2 = "No app required • Opens directly in Safari / Chrome • Delivered to your seat"
sub2_bbox = draw.textbbox((0, 0), sub2, font=font_sub)
draw.text((400 - (sub2_bbox[2] - sub2_bbox[0]) // 2, 915), sub2, fill=(160, 165, 181), font=font_sub)

# Wi-Fi link pill
wifi_y = 955
wifi_w = 380
wifi_h = 28
wifi_x = 400 - wifi_w // 2
draw.rounded_rectangle([wifi_x, wifi_y, wifi_x + wifi_w, wifi_y + wifi_h], radius=6, fill=(26, 30, 41), outline=(255, 255, 255, 40), width=1)
wifi_text = f"Wi-Fi Link: {TARGET_URL}"
wifi_bbox = draw.textbbox((0, 0), wifi_text, font=font_url)
draw.text((400 - (wifi_bbox[2] - wifi_bbox[0]) // 2, wifi_y + 6), wifi_text, fill=(255, 159, 28), font=font_url)

standee_paths = [
    os.path.join(artifact_dir, "cinebite_customer_dining_qr.png"),
    os.path.join(public_dir, "cinebite_customer_dining_qr.png"),
    os.path.join(workspace_dir, "cinebite_customer_dining_qr.png")
]
for p in standee_paths:
    standee.save(p)
print(f"Saved Standee ({standee_w}x{standee_h}) to:")
for p in standee_paths:
    print(f"  - {p}")

print("\n--- ALL IMAGES GENERATED WITH PILLOW ---")
