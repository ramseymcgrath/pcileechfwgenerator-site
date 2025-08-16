
## Overview

This document explains the project's policy on fallbacks for critical device-identification parameters (vendor ID, device ID, class code, revision ID) and how the current fallback subsystem enforces that policy.

Short version: the generator will refuse to accept or persist fallbacks for hardware-only identification values. Non-critical, non-unique settings may have safe fallbacks defined in `configs/fallbacks.yaml` or supplied by the user.

## Rationale

### Why generic firmware is problematic

Using fallback values for device-identification parameters produces firmware that is not device-unique. This creates three practical problems:

- Non-unique firmware undermines cloning accuracy and research reproducibility.
- Generic firmware is easier to detect and flags as suspicious.
- It encourages unrealistic testing and obscures hardware-specific bugs.

### Required configuration approach

The code enforces that hardware-identifying fields come from the device or an explicit user-provided context file. The enforcement is implemented in the fallback subsystem (`src/device_clone/fallback_manager.py`) and surfaced through the CLI helper (`src/cli/fallback_interface.py`).

When template validation fails because critical fields are missing, the CLI will export a sanitized YAML that the user can edit (default: `output/missing_context.yaml`). The export contains:

- `template_context`: the sanitized context with all sensitive fields removed
- `missing_critical_variables`: non-sensitive critical fields with empty `value` and a short `description` for the user to fill
- `sensitive_missing`: names of missing sensitive fields (no values provided)
- `fallbacks_template`: a safe-to-publish template of non-sensitive fallbacks the user may copy into `configs/fallbacks.yaml`

This flow ensures device IDs and other hardware-only secrets are never written to a shared fallback file by the generator.

### How it works (current system)

1) Fallback policy and code

 - Critical fields are declared in `configs/fallbacks.yaml` under `critical_variables` and enforced by `src/device_clone/fallback_manager.py`.
 - The manager supports static fallbacks (from the config file) and dynamic handlers but will not export or persist values for variables considered "sensitive" (device/vendor IDs, BARs, etc.).

2) CLI workflow

 - `src/cli/fallback_interface.py` wraps the manager for simple user workflows. The `--validate` flow applies fallbacks, runs critical-variable validation, and if validation fails, writes `output/missing_context.yaml` (sanitized) and logs/prints the location.
 - The exported file includes a `fallbacks_template` key users can copy into `configs/fallbacks.yaml` to persist safe defaults.

3) Templates and validation

 - Templates should not directly read hardware-only values. Use the generator's validation (`--validate-templates`) to scan for critical variable usage in Jinja templates. This check is implemented in the fallback manager and can be run from the CLI.

## Relevant files

- `src/device_clone/fallback_manager.py` — core fallback logic, critical variable definitions, scanning and export helpers
- `configs/fallbacks.yaml` — project-configured safe fallbacks and `critical_variables` list
- `src/cli/fallback_interface.py` — CLI helper which exports `output/missing_context.yaml` on validation failure and provides `fallbacks_template`
- `tests/test_device_config_fallback.py` — unit tests covering fallback loading and application

## Error messages and user flow

When validation fails the CLI prints/logs a short message and writes `output/missing_context.yaml` containing the fields the user should supply. Sensitive fields are never exported. The `missing_critical_variables` entries include a human-friendly `description` to guide what to enter.

## Testing

There are unit tests under `tests/` that exercise fallback loading, sanitization, and template validation. The `test_device_config_fallback.py` file demonstrates expected behavior for loading fallbacks from disk and enforcing critical-variable rules.

## Why This Helps

1. **Security**: Makes sure all firmware is device-specific and unique
2. **Reliability**: Forces proper device detection and configuration
3. **Debugging**: Clear error messages help find configuration problems
4. **Better Research**: Prevents unrealistic test scenarios with generic devices

## Updating Existing Code

If you're updating existing code:

1. **Remove Default Parameters**: Replace any default vendor/device IDs with proper validation
2. **Add Error Handling**: Add clear error messages for missing configuration
3. **Update Templates**: Use `{%- error %}` blocks instead of `| default()` filters
4. **Test Configuration**: Make sure all device identification fields are properly filled in

## When fallbacks are acceptable

- Subsystem IDs (only where the PCI spec allows fallback to subsystem/vendor values)
- Non-unique, optional features (timing, non-identity board settings)
- Build-tool settings (Vivado constraints, project settings) that do not affect device identity

If in doubt, prefer leaving a field unset and use the export flow (`--validate`) to generate `output/missing_context.yaml` and fill only the non-sensitive items.

---

**See Also**: [Device Cloning Guide](device-cloning.md), [Firmware Uniqueness](firmware-uniqueness.md), [Supported Devices](supported-devices.md)
