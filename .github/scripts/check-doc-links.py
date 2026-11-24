"""Check internal navigation links and anchors in the generated Astro site."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.anchors = set()
        self.links = []
        self.canonical = None
        self.feed(path.read_text(encoding="utf-8"))
        self.close()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.anchors.add(attrs["id"])
        if tag == "a" and attrs.get("name"):
            self.anchors.add(attrs["name"])
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")
        if tag in {"a", "area"} and attrs.get("href"):
            self.links.append(attrs["href"])
        if attrs.get("data-hero-link-href"):
            self.links.append(attrs["data-hero-link-href"])


def main():
    output = Path("dist")
    pages = {path: Page(path) for path in sorted(output.rglob("*.html"))}
    home = pages.get(output / "index.html")
    if not home or not home.canonical:
        raise SystemExit("Missing canonical URL in dist/index.html. Run npm run build first.")

    site = urlsplit(home.canonical)
    base_path = site.path.rstrip("/") + "/"
    errors = []

    for path, page in pages.items():
        route = path.relative_to(output).as_posix()
        if path.name == "index.html":
            route = route.removesuffix("index.html")
        page_url = urljoin(home.canonical, route)
        for link in dict.fromkeys(page.links):
            target = urlsplit(urljoin(page_url, link))
            if target.scheme not in {"http", "https"} or target.netloc != site.netloc:
                continue

            target_path = unquote(target.path)
            if target_path.rstrip("/") == base_path.rstrip("/"):
                target_path = base_path
            if not target_path.startswith(base_path):
                errors.append(f"{path}: {link} points outside {base_path}")
                continue

            destination = output / target_path.removeprefix(base_path)
            if destination.is_dir():
                destination /= "index.html"
            anchor = unquote(target.fragment.split(":~:", 1)[0])
            if not destination.is_file():
                errors.append(f"{path}: {link} points to a missing file")
            elif destination in pages and anchor and anchor.lower() != "top":
                if anchor not in pages[destination].anchors:
                    errors.append(f"{path}: {link} points to a missing anchor")

    if errors:
        raise SystemExit("\n".join(errors))
    print(f"Checked internal links and anchors in {len(pages)} HTML pages.")


if __name__ == "__main__":
    main()
