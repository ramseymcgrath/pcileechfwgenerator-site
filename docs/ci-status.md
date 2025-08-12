# CI/CD Status Dashboard

This page provides real-time status of all continuous integration and deployment workflows for the PCILeech Firmware Generator project.

## Build Status Overview

[![CI](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/ci.yml/badge.svg)](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/ci.yml)
[![Security & Safety Checks](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/safety-checks.yml/badge.svg)](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/safety-checks.yml)
[![Documentation](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/docs.yml/badge.svg)](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/docs.yml)

## Workflow Details

### 🔄 Main CI Pipeline

**Workflow:** [`ci.yml`](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/ci.yml)

**Triggers:**

- Push to `main`, `advanced-behavior-handling`, `missing-template-context`
- Pull requests to `main`

**Jobs:**

- **SystemVerilog Validation** - Validates SystemVerilog templates and generation patterns
- **Template Variable Validation** - Comprehensive template variable analysis (conditional)
- **Template Syntax Validation** - Jinja2 template syntax verification (conditional)
- **Unit Tests** - Python 3.9-3.12 test matrix with coverage
- **TUI Tests** - Textual user interface integration tests
- **Integration Tests** - Full host + container testing with Podman
- **Import Analysis** - Dependency and circular import detection
- **Documentation** - API docs generation with MkDocs
- **Packaging** - Source distribution and wheel building

### 🛡️ Security & Safety Checks

**Workflow:** [`safety-checks.yml`](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/safety-checks.yml)

**Triggers:**

- Push to `main`, `develop` (Python files only)
- Pull requests to `main`, `develop` (Python files only)
- Manual dispatch

**Jobs:**

- **Dictionary Safety** - Prevents KeyError exceptions in template contexts
- **Code Resilience** - Import safety and syntax validation
- **Anti-Pattern Detection** - Unsafe dictionary access pattern detection

## Branch Status

| Branch | CI Status | Last Updated |
|--------|-----------|--------------|
| main | [![CI - main](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/ci.yml?query=branch%3Amain) | ![Last Commit](https://img.shields.io/github/last-commit/ramseymcgrath/PCILeechFWGenerator/main) |
| missing-template-context | [![CI - missing-template-context](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/ci.yml/badge.svg?branch=missing-template-context)](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/ci.yml?query=branch%3Amissing-template-context) | ![Last Commit](https://img.shields.io/github/last-commit/ramseymcgrath/PCILeechFWGenerator/missing-template-context) |

## Coverage & Quality Metrics

[![codecov](https://codecov.io/gh/ramseymcgrath/PCILeechFWGenerator/graph/badge.svg)](https://codecov.io/gh/ramseymcgrath/PCILeechFWGenerator)
[![Python](https://img.shields.io/pypi/pyversions/pcileech-fw-generator)](https://pypi.org/project/pcileech-fw-generator/)
[![License](https://img.shields.io/github/license/ramseymcgrath/PCILeechFWGenerator)](https://github.com/ramseymcgrath/PCILeechFWGenerator/blob/main/LICENSE.txt)

## Recent Workflow Runs

### Latest CI Runs

<!-- This would be dynamically populated in a real dashboard -->
View the [latest CI runs](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/ci.yml) for detailed logs and artifacts.

### Latest Security Checks

View the [latest security checks](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions/workflows/safety-checks.yml) for safety validation results.

## Monitoring & Alerts

### GitHub Actions Notifications

- ✅ Success notifications disabled (reduce noise)
- ❌ Failure notifications enabled for maintainers
- ⚠️ Warning annotations for non-blocking issues

### Available Artifacts

- **Template Validation Reports** - Detailed template analysis and fixes
- **Integration Logs** - Full integration test outputs
- **Documentation Site** - Generated API documentation
- **Python Packages** - Built wheels and source distributions
- **Import Analysis** - Dependency reports

## Template Validation Details

The enhanced template validation system provides:

### Variable Validation

- **Context Analysis** - Ensures all template variables are defined
- **Type Checking** - Validates expected variable types
- **Dependency Tracking** - Maps template dependencies
- **Fix Suggestions** - Automated fix recommendations

### Syntax Validation

- **Jinja2 Parsing** - Template syntax verification
- **Extension Support** - `.j2`, `.jinja`, `.jinja2` files
- **Error Reporting** - Line-specific syntax errors

## Troubleshooting

### Common Issues

#### Template Validation Warnings

Template validation runs as non-blocking by default. Warnings indicate:

- Missing context variables
- Undefined template dependencies
- Potential runtime errors

**Resolution:** Check the template validation artifacts for detailed reports and suggested fixes.

#### Security Check Failures

Security checks are designed to catch:

- Unsafe dictionary access patterns
- Missing error handling
- Import safety issues

**Resolution:** Review the security check logs and apply suggested code improvements.

## Workflow Configuration

### Conditional Execution

Template validation jobs use smart conditional execution:

```yaml
if: contains(github.event.head_commit.modified, 'src/templates/') || 
    contains(github.event.head_commit.modified, 'src/templating/') || 
    github.event_name == 'pull_request'
```

This ensures template-specific checks only run when relevant files change, improving CI efficiency.

### Caching Strategy

All workflows use pip dependency caching to reduce build times:

- Cache key includes requirements file hashes
- Separate cache namespaces for different job types
- 30-day retention for build artifacts

---

!!! tip "Pro Tip"
    Use the workflow badges above to quickly check the current status of all CI/CD pipelines. Click any badge to view detailed logs and artifacts.

!!! info "Real-time Updates"
    This page shows the current status of CI/CD workflows. For the most up-to-date information, visit the [GitHub Actions page](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions) directly.
