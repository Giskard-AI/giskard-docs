#!/usr/bin/env bash
#
# Create or update a single "sticky" PR comment.
#
# The comment starts with a hidden HTML marker derived from <name>. On the
# next run we find the comment by that marker and edit it in place, so a PR
# keeps one up-to-date comment instead of collecting one per push.
#
# Usage:  post-sticky-comment.sh <name> <body-file>
# Needs:  GH_TOKEN, REPO, PR_NUMBER in the environment (set by the workflow).
set -euo pipefail

name="$1"
body_file="$2"
marker="<!-- sticky-comment: $name -->"

body=$(mktemp)
{
  echo "$marker"
  echo
  cat "$body_file"
} > "$body"

existing_id=$(
  gh api "repos/$REPO/issues/$PR_NUMBER/comments" --paginate |
    jq --arg marker "$marker" 'first(.[] | select(.body | startswith($marker)) | .id) // empty'
)

if [ -n "$existing_id" ]; then
  gh api --method PATCH "repos/$REPO/issues/comments/$existing_id" --field "body=@$body" > /dev/null
  echo "Updated comment $existing_id on PR #$PR_NUMBER"
else
  gh api "repos/$REPO/issues/$PR_NUMBER/comments" --field "body=@$body" > /dev/null
  echo "Created comment on PR #$PR_NUMBER"
fi
