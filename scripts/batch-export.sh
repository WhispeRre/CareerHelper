#!/bin/bash
# Batch export a resume to PDF with all templates
# Usage: ./scripts/batch-export.sh <resume-id> [output-dir]

RESUME_ID="${1:-6c2096f2-6eb5-4151-8d05-7763ae3a3a61}"
OUT_DIR="${2:-./pdfs}"
FP="${3:-359b89b146db3a5eb0ebd0b625c26d66}"
BASE="http://localhost:3001"

TEMPLATES=(
  classic modern minimal professional two-column creative ats academic
  elegant executive developer designer startup formal infographic compact
  euro clean bold timeline nordic corporate consultant finance medical
  gradient metro material coder blocks magazine artistic retro neon
  watercolor swiss japanese berlin luxe rose architect legal teacher
  scientist engineer sidebar card zigzag ribbon mosaic
)

mkdir -p "$OUT_DIR"

# Save original template
ORIGINAL=$(curl -s -H "x-fingerprint: $FP" "$BASE/api/resume/$RESUME_ID/export?format=json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('template','classic'))" 2>/dev/null)
echo "Original template: $ORIGINAL"
echo "Exporting ${#TEMPLATES[@]} templates to $OUT_DIR ..."

for TPL in "${TEMPLATES[@]}"; do
  echo -n "  $TPL ... "

  # Update template
  curl -s -X PUT "$BASE/api/resume/$RESUME_ID" \
    -H "x-fingerprint: $FP" \
    -H "Content-Type: application/json" \
    -d "{\"template\":\"$TPL\"}" > /dev/null

  # Export PDF
  HTTP_CODE=$(curl -s -o "$OUT_DIR/${TPL}.pdf" -w "%{http_code}" \
    -H "x-fingerprint: $FP" \
    "$BASE/api/resume/$RESUME_ID/export?format=pdf")

  if [ "$HTTP_CODE" = "200" ]; then
    SIZE=$(wc -c < "$OUT_DIR/${TPL}.pdf" | tr -d ' ')
    echo "OK (${SIZE} bytes)"
  else
    echo "FAILED (HTTP $HTTP_CODE)"
    rm -f "$OUT_DIR/${TPL}.pdf"
  fi
done

# Restore original template
curl -s -X PUT "$BASE/api/resume/$RESUME_ID" \
  -H "x-fingerprint: $FP" \
  -H "Content-Type: application/json" \
  -d "{\"template\":\"$ORIGINAL\"}" > /dev/null

echo "Done! Restored template to: $ORIGINAL"
