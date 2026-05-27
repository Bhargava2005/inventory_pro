from PIL import Image
import os

files = ['logo.png', 'pwa-192x192.png', 'pwa-512x512.png']
base_path = r'd:\Node Projects\inventory-pro\client\public'

for f in files:
    path = os.path.join(base_path, f)
    if os.path.exists(path):
        with Image.open(path) as img:
            print(f"{f}: {img.size[0]}x{img.size[1]}")
    else:
        print(f"{f}: Not found")
