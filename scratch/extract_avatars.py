import os
from PIL import Image

src_path = r"C:\Users\DAVID\.gemini\antigravity\brain\52045a6f-53b8-459b-bff3-8ef86756fbb1\.user_uploaded\media_1787421205071.jpg"
out_dir = r"c:\Users\DAVID\Downloads\copia seguridad 1\img\avatars"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")

# Exact bounding boxes for the 9 stickers
boxes = [
    # Row 1
    {"id": "raccoon_sleepy",   "name": "Mapache Dormilón",  "box": (60, 115, 360, 345)},
    {"id": "raccoon_knife",    "name": "Mapache Fiero",     "box": (380, 140, 640, 345)},
    {"id": "raccoon_sad",      "name": "Mapache Llorón",    "box": (660, 155, 920, 345)},
    # Row 2
    {"id": "raccoon_happy",    "name": "Mapache Feliz",     "box": (70, 385, 350, 600)},
    {"id": "raccoon_trashcan", "name": "Mapache Basurero",  "box": (390, 380, 610, 630)},
    {"id": "raccoon_ghost",    "name": "Mapache Fantasma",  "box": (660, 395, 935, 620)},
    # Row 3
    {"id": "raccoon_bandaid",  "name": "Mapache Valiente",  "box": (75, 660, 355, 880)},
    {"id": "raccoon_skeleton", "name": "Mapache Calavera",  "box": (370, 660, 635, 875)},
    {"id": "raccoon_melt",     "name": "Mapache Derretido", "box": (650, 680, 945, 865)}
]

for item in boxes:
    cropped = img.crop(item["box"])
    
    # Optional: convert outer pure white pixels (> 250, 250, 250) to transparent
    datas = cropped.getdata()
    newData = []
    for pixel in datas:
        # If it's pure background white
        if pixel[0] > 248 and pixel[1] > 248 and pixel[2] > 248:
            newData.append((255, 255, 255, 0)) # transparent
        else:
            newData.append(pixel)
    
    cropped.putdata(newData)
    
    out_file = os.path.join(out_dir, item["id"] + ".png")
    cropped.save(out_file, "PNG")
    print(f"Generated avatar: {out_file} ({cropped.size})")

print("All 9 avatars extracted with transparent background!")
