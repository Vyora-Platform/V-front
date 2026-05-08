import shutil
import os

src = r"C:\Users\Admin\.gemini\antigravity\brain\a66867e6-1460-493e-8783-b9b23a2e6a9d\vyora_name_logo_1773934053137.png"

# Assets to overwrite
destinations = [
    r"d:\V-front-main\V-front-main\client\public\logo.png",
    r"d:\V-front-main\V-front-main\client\public\favicon.png",
    r"d:\V-front-main\V-front-main\client\public\og-image.jpg"
]

results = []

try:
    if os.path.exists(src):
        for dst in destinations:
            # For og-image, maybe user wants it even if it's .jpg extension but content is .png
            # Actually browsers handle it, but I'll copy faithfully.
            shutil.copy2(src, dst)
            results.append(f"Copied to {dst}")
        print("Success: " + ", ".join(results))
    else:
        print("Source not found")
except Exception as e:
    print(f"Error: {e}")
