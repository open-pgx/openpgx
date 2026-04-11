#!/bin/bash
# ============================================================
# OpenPGx DNA Protection Script
# ============================================================
# Prevents accidental commit/push of genetic data.
# Runs as a pre-commit hook or standalone check.
#
# Install as git hook:
#   cp scripts/check-no-dna.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Or run manually:
#   bash scripts/check-no-dna.sh
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🧬 OpenPGx DNA Protection Check"
echo "================================"

FOUND_DNA=0

# 1. Check staged files for DNA data patterns
echo -n "Checking staged files for genetic data... "

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || git diff --name-only HEAD 2>/dev/null || find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './dist/*')

for file in $STAGED_FILES; do
  [ ! -f "$file" ] && continue

  # Check file extensions
  case "$file" in
    *.23andme.txt|*genome*.txt|*23andMe*.txt|*ancestry*.txt|*.vcf|*.vcf.gz|*.bam|*.sam|*.fastq|*.fastq.gz|*.fasta)
      echo ""
      echo -e "${RED}  ✗ BLOCKED: $file — looks like raw genetic data!${NC}"
      FOUND_DNA=1
      continue
      ;;
  esac

  # Check file content for DNA data signatures (first 50 lines)
  if head -50 "$file" 2>/dev/null | grep -qP '^rs\d+\t\d+\t\d+\t[ACGT]{1,2}'; then
    echo ""
    echo -e "${RED}  ✗ BLOCKED: $file — contains 23andMe/genetic data format (rsID + genotype)!${NC}"
    FOUND_DNA=1
    continue
  fi

  # Check for OpenPGx patient profiles (not drug cache)
  if head -10 "$file" 2>/dev/null | grep -q '"pharmacogenes"'; then
    if head -10 "$file" 2>/dev/null | grep -q '"genotypes"'; then
      echo ""
      echo -e "${RED}  ✗ BLOCKED: $file — contains OpenPGx patient profile with genotype data!${NC}"
      FOUND_DNA=1
      continue
    fi
  fi

  # Check for large files that might be DNA data
  SIZE=$(wc -c < "$file" 2>/dev/null || echo 0)
  if [ "$SIZE" -gt 10000000 ]; then  # >10MB
    if head -5 "$file" 2>/dev/null | grep -qiP '(23andme|ancestry|genotype|chromosome|rsid)'; then
      echo ""
      echo -e "${RED}  ✗ BLOCKED: $file — large file with genetic data markers (${SIZE} bytes)!${NC}"
      FOUND_DNA=1
      continue
    fi
  fi
done

if [ $FOUND_DNA -eq 0 ]; then
  echo -e "${GREEN}✓ Clean — no genetic data detected.${NC}"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ⚠️  COMMIT BLOCKED — Genetic data detected!           ║${NC}"
  echo -e "${RED}║                                                         ║${NC}"
  echo -e "${RED}║  Genetic data is the most sensitive data that exists.   ║${NC}"
  echo -e "${RED}║  It never changes, uniquely identifies you forever.     ║${NC}"
  echo -e "${RED}║                                                         ║${NC}"
  echo -e "${RED}║  Move your DNA files to: genomes/ (gitignored)          ║${NC}"
  echo -e "${RED}║  Or add them to .gitignore manually.                    ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi
