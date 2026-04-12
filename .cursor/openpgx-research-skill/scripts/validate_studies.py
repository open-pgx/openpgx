#!/usr/bin/env python3
"""
OpenPGx Study Validator
Validates study JSON files against the schema + quality checks.

Usage:
  python validate_studies.py [file1.json file2.json ...]
  python validate_studies.py --all          # validate all studies in data/pgx/studies/
  python validate_studies.py --new          # validate only files modified in last 24h
"""

import json
import sys
import os
import time
from pathlib import Path

try:
    from jsonschema import validate, ValidationError
except ImportError:
    print("Installing jsonschema...")
    os.system("pip install jsonschema --break-system-packages -q")
    from jsonschema import validate, ValidationError


def find_project_root():
    """Walk up from CWD to find mcp-server/data/pgx/studies/"""
    candidates = [
        Path.cwd(),
        Path.cwd() / "mcp-server",
        Path.cwd().parent,
        Path.cwd().parent / "mcp-server",
    ]
    for p in candidates:
        schema = p / "docs" / "openpgx.study.schema.json"
        if not schema.exists():
            schema = p / "mcp-server" / "docs" / "openpgx.study.schema.json"
        if schema.exists():
            return schema.parent.parent
    return None


def load_schema(root):
    schema_paths = [
        root / "docs" / "openpgx.study.schema.json",
        root / "mcp-server" / "docs" / "openpgx.study.schema.json",
        root.parent / "openpgx.study.schema.json",
    ]
    for p in schema_paths:
        if p.exists():
            with open(p) as f:
                return json.load(f)
    print("ERROR: Cannot find openpgx.study.schema.json")
    sys.exit(1)


def quality_checks(data, filename):
    """Checks beyond JSON schema validation."""
    warnings = []
    errors = []

    # Check genotype completeness
    for snp in data.get("snps", []):
        rsid = snp.get("rsid", "?")
        interps = snp.get("interpretations", {})
        genotypes = list(interps.keys())

        # Check both het orderings
        for gt in genotypes:
            if len(gt) == 2:
                rev = gt[1] + gt[0]
                if rev != gt and rev not in genotypes:
                    warnings.append(f"  {rsid}: missing reverse genotype '{rev}' (has '{gt}')")

        # Check we have at least 3 unique genotypes
        unique_gts = set()
        for gt in genotypes:
            unique_gts.add("".join(sorted(gt)))
        if len(unique_gts) < 3:
            warnings.append(f"  {rsid}: only {len(unique_gts)} unique genotypes (need ≥3: hom_risk, het, hom_ref)")

        # Severity consistency
        severities = {"info": 0, "mild": 1, "moderate": 2, "severe": 3, "life_threatening": 4}
        for gt, interp in interps.items():
            sev = interp.get("severity", "info")
            if sev not in severities:
                errors.append(f"  {rsid}/{gt}: invalid severity '{sev}'")

        # Population frequency sanity
        pop_freq = snp.get("population_frequency", {})
        for pop, freq in pop_freq.items():
            if freq is None:
                continue
            if freq < 0 or freq > 1:
                errors.append(f"  {rsid}: population_frequency[{pop}] = {freq} (must be 0-1)")
            if freq > 0.99:
                warnings.append(f"  {rsid}: population_frequency[{pop}] = {freq} (>0.99 — is this the risk allele freq?)")

    # Source URL check
    source = data.get("source", {})
    pmid = source.get("pmid")
    url = source.get("url", "")
    if pmid and pmid != "null" and f"/{pmid}" not in url:
        warnings.append(f"  Source URL doesn't contain PMID {pmid}")

    # Gene naming
    gene = data.get("gene", "")
    if gene != gene.upper() and gene != gene:
        warnings.append(f"  Gene '{gene}' — should be HGNC standard (usually uppercase)")

    # Evidence level
    ev = data.get("evidence_level")
    if ev not in ["established", "moderate", "emerging", "preliminary", None]:
        errors.append(f"  Invalid evidence_level: '{ev}'")

    return warnings, errors


def validate_file(filepath, schema):
    """Validate a single study file. Returns (ok, warnings, errors)."""
    filename = os.path.basename(filepath)

    try:
        with open(filepath) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return False, [], [f"  JSON parse error: {e}"]

    schema_errors = []
    try:
        validate(instance=data, schema=schema)
    except ValidationError as e:
        schema_errors.append(f"  Schema: {e.message}")

    warnings, quality_errors = quality_checks(data, filename)
    all_errors = schema_errors + quality_errors

    return len(all_errors) == 0, warnings, all_errors


def main():
    root = find_project_root()
    if not root:
        print("ERROR: Cannot find project root (looking for mcp-server/docs/)")
        sys.exit(1)

    schema = load_schema(root)
    studies_dir = root / "data" / "pgx" / "studies"
    if not studies_dir.exists():
        studies_dir = root / "mcp-server" / "data" / "pgx" / "studies"

    # Determine which files to validate
    if "--all" in sys.argv:
        files = sorted(studies_dir.glob("*.json"))
    elif "--new" in sys.argv:
        cutoff = time.time() - 86400
        files = sorted(f for f in studies_dir.glob("*.json") if f.stat().st_mtime > cutoff)
    elif len(sys.argv) > 1:
        files = []
        for arg in sys.argv[1:]:
            if arg.startswith("--"):
                continue
            p = Path(arg)
            if not p.exists():
                p = studies_dir / arg
            if p.exists():
                files.append(p)
            else:
                print(f"NOT FOUND: {arg}")
    else:
        print(__doc__)
        sys.exit(0)

    if not files:
        print("No files to validate.")
        sys.exit(0)

    print(f"Validating {len(files)} study file(s)...\n")

    total_ok = 0
    total_warnings = 0
    total_errors = 0

    for f in files:
        ok, warnings, errors = validate_file(f, schema)
        name = f.name

        if ok and not warnings:
            print(f"  ✓ {name}")
            total_ok += 1
        elif ok and warnings:
            print(f"  ⚠ {name}")
            for w in warnings:
                print(f"    {w}")
            total_ok += 1
            total_warnings += len(warnings)
        else:
            print(f"  ✗ {name}")
            for e in errors:
                print(f"    {e}")
            for w in warnings:
                print(f"    {w}")
            total_errors += 1
            total_warnings += len(warnings)

    print(f"\n{'='*50}")
    print(f"Results: {total_ok}/{len(files)} valid")
    if total_warnings:
        print(f"Warnings: {total_warnings}")
    if total_errors:
        print(f"Errors: {total_errors}")
        sys.exit(1)
    else:
        print("All files passed validation! 🎉")


if __name__ == "__main__":
    main()
