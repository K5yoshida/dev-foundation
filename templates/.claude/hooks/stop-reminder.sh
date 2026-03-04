#!/bin/bash
# Claude Code Stop hook: reminds to update progress tracker

INPUT=$(cat)

STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')

# Prevent infinite loop
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# Check for unchecked items in progress tracker
# Customize STATUS_FILE to match your project's tracker
STATUS_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/IMPLEMENTATION_STATUS.md"

if [ -f "$STATUS_FILE" ]; then
  UNCHECKED=$(grep -c '^\- \[ \]' "$STATUS_FILE" 2>/dev/null || echo "0")
  if [ "$UNCHECKED" -gt 0 ]; then
    echo '{
      "decision": "block",
      "reason": "Progress tracker has unchecked items. Did you update it? Reply with confirmation to proceed."
    }'
    exit 0
  fi
fi

exit 0
