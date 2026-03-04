#!/bin/bash
# Claude Code PreToolUse hook: blocks console.log, any type, and .env writes
# Test files are excluded from checks

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""')

# Skip non-TypeScript/JavaScript files
if ! echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  exit 0
fi

# Skip test files
if echo "$FILE_PATH" | grep -qE '\.(test|spec)\.(ts|tsx|js|jsx)$'; then
  exit 0
fi

# Skip test directories
if echo "$FILE_PATH" | grep -qE '(tests/|__tests__/|e2e/)'; then
  exit 0
fi

# Check for console.log
if echo "$CONTENT" | grep -q 'console\.log'; then
  echo '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": "console.log is prohibited in production code. Use a logger or remove it."
    }
  }'
  exit 0
fi

# Check for any type (: any or as any)
if echo "$CONTENT" | grep -qE '(:\s*any\b|as\s+any\b)'; then
  echo '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": "any type is prohibited. Use unknown instead."
    }
  }'
  exit 0
fi

# Check for .env file writes
if echo "$FILE_PATH" | grep -qE '\.env($|\.)'; then
  if ! echo "$FILE_PATH" | grep -q '\.env\.example'; then
    echo '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": ".env files must not be modified by AI agents. Only .env.example is allowed."
      }
    }'
    exit 0
  fi
fi

exit 0
