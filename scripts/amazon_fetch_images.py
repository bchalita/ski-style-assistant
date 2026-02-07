#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "item"


def extract_image_url(html: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    img = soup.select_one("#landingImage")
    if not img:
        return None
    # Prefer high-res if available, otherwise fallback to src.
    hires = img.get("data-old-hires")
    if hires:
        return hires
    dyn = img.get("data-a-dynamic-image")
    if dyn:
        # data-a-dynamic-image is a JSON map {url: [w,h], ...}
        # pick the first URL key.
        try:
            data = json.loads(dyn)
            if data:
                return next(iter(data.keys()))
        except json.JSONDecodeError:
            pass
    return img.get("src")


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    dest.write_bytes(resp.content)


def fetch_product_image(product_url: str) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    resp = requests.get(product_url, headers=headers, timeout=30)
    resp.raise_for_status()
    image_url = extract_image_url(resp.text)
    if not image_url:
        raise RuntimeError("Could not find product image.")
    return image_url


def search_amazon_product_url(query: str, serpapi_key: str) -> str:
    params = {
        "engine": "amazon",
        "amazon_domain": "amazon.com",
        "type": "search",
        "k": query,
        "api_key": serpapi_key,
    }
    resp = requests.get("https://serpapi.com/search.json", params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    results = data.get("organic_results") or []
    if not results:
        raise RuntimeError("No search results returned.")
    # Prefer first organic result link.
    url = results[0].get("link")
    if not url:
        raise RuntimeError("No product link found in results.")
    return url


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Search Amazon and download product images by brand/color."
    )
    parser.add_argument(
        "--out",
        default="images",
        help="Output folder for brand/color images.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print resolved image URLs without downloading.",
    )
    args = parser.parse_args()

    serpapi_key = os.getenv("SERPAPI_KEY", "").strip()
    if not serpapi_key:
        print("Missing SERPAPI_KEY environment variable.", file=sys.stderr)
        return 1

    brands = ["North Face", "Spyder", "Free Soldier"]
    colors = ["red", "blue", "black"]
    model = "ski jacket"
    out_root = Path(args.out)

    for brand in brands:
        for color in colors:
            query = f"{brand} {model} {color}"
            print(f"Searching: {query}")
            try:
                product_url = search_amazon_product_url(query, serpapi_key)
                image_url = fetch_product_image(product_url)
            except Exception as exc:
                print(f"Failed {brand}/{color}: {exc}")
                continue

            file_name = slugify(f"{brand}-{color}") + ".jpg"
            dest = out_root / slugify(brand) / slugify(color) / file_name
            if args.dry_run:
                print(f"{brand}/{color}: {image_url}")
                continue

            try:
                download(image_url, dest)
                print(f"Saved {brand}/{color} -> {dest}")
            except Exception as exc:
                print(f"Download failed {brand}/{color}: {exc}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
