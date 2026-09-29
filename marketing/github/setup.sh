#!/usr/bin/env bash
# One-shot GitHub prep for the launch. Review before running; it changes repo settings.
#   bash marketing/github/setup.sh            # dry run: prints commands
#   bash marketing/github/setup.sh --apply    # executes them
set -euo pipefail

REPO="buiducnhat/slash-editor"
DIR="$(cd "$(dirname "$0")" && pwd)"
APPLY=false
[[ "${1:-}" == "--apply" ]] && APPLY=true

run() {
  if $APPLY; then "$@"; else printf '+'; printf ' %q' "$@"; printf '\n'; fi
}

# 1. Discussions + extra topics (existing topics are kept by --add-topic).
run gh repo edit "$REPO" --enable-discussions \
  --add-topic notion --add-topic editor --add-topic shadcn --add-topic nextjs \
  --add-topic typescript --add-topic yjs --add-topic collaboration \
  --homepage "https://slasheditor.dev"

# 2. Labels used by the draft issues (--force updates existing ones).
run gh label create "good first issue" --repo "$REPO" --color 7057ff --force \
  --description "Good for newcomers"
run gh label create "help wanted" --repo "$REPO" --color 008672 --force \
  --description "Extra attention is needed"
run gh label create "accessibility" --repo "$REPO" --color d4c5f9 --force
run gh label create "performance" --repo "$REPO" --color fbca04 --force
run gh label create "discussion" --repo "$REPO" --color c5def5 --force

# 3. Issues from good-first-issues.md: "## Title", "labels: a, b", then body until next "## ".
awk '
  /^## / { if (title) print_issue(); title = substr($0, 4); labels = ""; body = ""; next }
  /^labels: / && title && !labels { labels = substr($0, 9); next }
  title { body = body $0 "\n" }
  END { if (title) print_issue() }
  function print_issue() { printf "%s\x1f%s\x1f%s\x1e", title, labels, body }
' "$DIR/good-first-issues.md" | while IFS=$'\x1f' read -r -d $'\x1e' title labels body; do
  args=(gh issue create --repo "$REPO" --title "$title" --body "$body")
  IFS=',' read -ra ls <<<"$labels"
  for l in "${ls[@]}"; do args+=(--label "$(echo "$l" | xargs)"); done
  run "${args[@]}"
done

# 4. Manual steps (no gh API):
cat <<'EOF'

Manual:
  - Settings > General > Social preview: upload marketing/media/social-preview.png
  - Discussions: pin a welcome post from marketing/github/discussions-welcome.md
  - Sponsors: enable GitHub Sponsors, then set `github: buiducnhat` in FUNDING.yml
EOF
