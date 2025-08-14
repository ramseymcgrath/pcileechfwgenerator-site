# Fallbacks — PCILeech Firmware Generator

# Fallbacks — PCILeech Firmware Generator

## Overview

The fallback system provides safe defaults and policies for template variables used by the PCILeech Firmware Generator. Its purpose is to:

- Ensure templates have non-blocking defaults for non-sensitive configuration items.
- Prevent sensitive, hardware-derived values (like PCI IDs and BARs) from being provided by user defaults or templates.
- Provide a single API to register static fallbacks and dynamic handlers, validate required hardware-only variables, and export missing context in a safe form for users.

This document explains the architecture, configuration, and usage of the fallback system.

## Key components

- `src/device_clone/fallback_manager.py` — Core implementation. The `FallbackManager` class manages registered fallbacks, dynamic handlers, critical variable rules, template scanning and validation, and configuration import/export.
- `configs/fallbacks.yaml` — Default YAML configuration used by the project and by the CLI helper. It contains a whitelist of critical variables and safe fallback values.
- `src/cli/fallback_interface.py` — Small CLI / helper wrapper around `FallbackManager` providing convenient validation, safe missing-context export, and loading user-provided context files.
- Tests: unit tests referencing fallback behavior are located under `tests/` (for example `tests/test_device_config_fallback.py` exercises related device config fallbacks).

## Concepts and policies

- Critical variables: hardware-derived values that must NOT be filled by fallbacks. Examples: `device.vendor_id`, `device.device_id`, `device.revision_id`, `device.class_code`, `device.subsys_vendor_id`, `device.subsys_device_id`, and `device.bars`. These are marked as critical in the manager and in `configs/fallbacks.yaml`.

- Sensitive variables: variables that contain or imply hardware identity. The manager has built-in sensitive tokens (e.g. `vendor_id`, `device_id`, `revision_id`, `class_code`, `bars`, `subsys`) and treats names containing these tokens as sensitive. Sensitive variables are not exported to user-editable context files.

- Fallback modes (policy): `none`, `auto`, or `prompt`. These affect whether non-critical fallbacks are permitted automatically. By default the manager uses a `prompt`-style permissive mode for non-interactive builds.

- Defaults vs registered fallbacks: The manager initializes with a set of safe built-in defaults (such as `board.fpga_family: "7series"`, `sys_clk_freq_mhz: 100`, `supports_msi: true`, etc.). Users or code may register additional fallbacks or dynamic handlers at runtime.

## The `FallbackManager` API (high level)

The important surface area to know when using the manager programmatically:

- Constructor: `FallbackManager(config_path=None, mode='prompt', allowed_fallbacks=None)` — Instantiates the manager and will load `config_path` if provided.

- `register_fallback(var_name: str, value: Any, description: Optional[str]=None) -> bool` — Register a static fallback. Fails if `var_name` is marked critical or the name is invalid.

- `register_handler(var_name: str, handler: Callable[[], Any], description=None) -> bool` — Register a dynamic handler callable. The callable is invoked when the fallback is requested/applied.

- `mark_as_critical(var_names: List[str])` — Mark additional variables as critical (preventing fallbacks). Useful for project or device-specific rules.

- `get_fallback(var_name: str) -> Any` — Retrieve a fallback value (raises `ValueError` if the variable is critical; raises `RuntimeError` if a dynamic handler fails).

- `apply_fallbacks(template_context: Optional[Dict]) -> Dict` — Apply all registered fallbacks to a copied template context, creating missing nested dicts as needed for dotted names (e.g. `board.fpga_family`). Returns the updated context.

- `validate_critical_variables(template_context: Dict) -> Tuple[bool, List[str]]` — Check that all critical variables have non-empty values in the provided context. Returns `(True, [])` when valid.

- `scan_template_variables(template_dir: str, pattern: str='*.j2') -> Set[str]` — Scans Jinja templates for variables and returns the set of discovered names.

- `validate_templates_for_critical_vars(template_dir, pattern='*.j2') -> bool` — Security check that templates don't directly reference critical variables.

- `load_from_config(config_path: str) -> bool` — Load YAML configuration which may define `critical_variables` and `fallbacks`.

- `get_exposable_fallbacks() -> Dict[str, Any]` — Returns a safe-to-show set of fallbacks (omits sensitive names and dynamic handlers); default-registered fallbacks are presented as blank strings to prompt user input.

- `export_config(output_path: str) -> bool` — Writes non-sensitive, non-dynamic fallbacks to YAML.

## How fallbacks are applied (behavior)

1. The manager maintains an internal registry mapping variable names (dot-notation allowed) to `VariableMetadata` objects. Metadata includes `value`, `var_type` (critical/sensitive/standard/default), whether it's dynamic, and an optional `handler` callable.

2. When `apply_fallbacks()` runs, the manager iterates its registry and attempts to apply each non-critical fallback to the provided context. For dotted names it will create missing parent dictionaries. A fallback only writes a value when the variable is absent or empty — it does not overwrite existing context values.

3. For dynamic fallbacks (registered via `register_handler`) the handler is invoked to obtain the value. Handler exceptions are logged; the failing handler is skipped and the process continues.

4. After fallbacks are applied a caller should run `validate_critical_variables()` to ensure hardware-only values exist. If that validation fails, the CLI helper can export a sanitized missing-context YAML that intentionally omits sensitive values.

## Config file: `configs/fallbacks.yaml`

The YAML file contains two top-level sections:

- `critical_variables`: list of dot-notation names that are always treated as hardware-only and must not have fallbacks.
- `fallbacks`: mapping of safe fallback values (non-sensitive) to register on manager initialization or when loaded.

The repository includes a recommended `configs/fallbacks.yaml` with sensible defaults for board and timing values. Important: the config is intentionally explicit about not including device IDs or BARs.

## CLI helper: `src/cli/fallback_interface.py`

The CLI wrapper provides convenience functions used by utilities and the TUI:

- `validate_templates(template_dir)` — runs `validate_templates_for_critical_vars` and prints clear warnings/errors.
- `validate_context(template_context)` — applies fallbacks and validates critical variables. If validation fails it exports `output/missing_context.yaml` with a sanitized `fallbacks_template` field and a `missing_critical_variables` list the user can fill (sensitive fields are listed but not exported values).
- `load_context_file(path)` — safely loads a user-supplied YAML 'context' file into a context dict while stripping any sensitive fields supplied by the user (those are ignored and a warning emitted).

The CLI ensures exported files never contain hardware-only sensitive values. See the source for exact export structure and descriptions.

## Security guidance and best practices

- NEVER provide device/vendor IDs, BAR contents, or other hardware-derived identifiers as fallbacks. These must always be read from the hardware and treated as authoritative.

- Keep `critical_variables` accurate for new device types. If your templates begin referencing an additional hardware-only field, mark it critical.

- Use `validate_templates_for_critical_vars()` as part of any CI or pre-commit checks to ensure templates don't accidentally reference critical fields.

- When exporting a missing-context YAML for users, the CLI intentionally strips sensitive values and prompts the user to fill only safe, non-sensitive fields.

````markdown

# Fallbacks

This page explains the fallback system and how to use it. It's written for first-time users who are generating firmware from donor hardware and need to understand when it's safe to supply defaults and when values must come directly from the device.

## Quick summary (for first-time users)

- Fallbacks provide safe defaults for non-sensitive template variables so template rendering doesn't fail when optional items are missing.
- Hardware-derived values (vendor/device IDs, BAR content, MSI-X tables, etc.) are treated as critical and must come from the donor device — they are never supplied as fallbacks.
- The tool includes a CLI helper that applies fallbacks, validates required hardware-only fields, and exports a sanitized "missing context" YAML that you can edit.

## Why this matters

If you are generating firmware from a donor card, it is essential that identifying hardware values come directly from that card. Using fallbacks for those values would produce generic or insecure firmware. Fallbacks are safe for things like clock frequency, board family, or optional template paths.

## Quick steps (recommended for first-time users)

1. Run the generator or TUI to extract donor data. If generation fails due to missing values, the tool will export a sanitized missing-context file to `output/missing_context.yaml`.

2. Open `output/missing_context.yaml`. It contains a `fallbacks_template` section and a `missing_critical_variables` list. Only fill the non-sensitive entries in `fallbacks_template` — do not add device/vendor IDs.

3. Re-run the generator with the context file if needed, or supply additional safe fallback values via CLI or programmatic API.

Example: export/validate a context file using the CLI helper

```bash
python -m src.cli.fallback_interface --validate path/to/context.json
```

Validate templates for accidental hardware-only references:

```bash
python -m src.cli.fallback_interface --validate-templates path/to/templates
```

## What is a "critical" variable?

Critical variables are hardware-only fields that must be read from the donor device. Examples include:

- `device.vendor_id`
- `device.device_id`
- `device.revision_id`
- `device.class_code`
- `device.subsys_vendor_id`
- `device.subsys_device_id`
- `device.bars`

These are marked in the configuration and enforced by the fallback manager.

## Where to find the code

- `src/device_clone/fallback_manager.py` — core implementation and programmatic API
- `configs/fallbacks.yaml` — recommended, safe default fallbacks and critical variable list
- `src/cli/fallback_interface.py` — CLI wrapper used to validate contexts and export sanitized YAML

## Basic programmatic examples

Register a static fallback:

```python
from src.device_clone.fallback_manager import FallbackManager
fm = FallbackManager()
fm.register_fallback('board.fpga_family', '7series')
```

Register a dynamic handler:

```python
def compute_freq():
    return 125

fm.register_handler('sys_clk_freq_mhz', compute_freq)
```

Apply fallbacks and validate that required hardware values exist:

```python
ctx = fm.apply_fallbacks(existing_context)
ok, missing = fm.validate_critical_variables(ctx)
if not ok:
    # check `missing` for what to provide (note: sensitive fields will be listed but not populated)
```

## Best practices for first-time users

- Do not add device/vendor IDs or BAR contents to `configs/fallbacks.yaml` or to any exported context files. These are hardware-only.
- Use the CLI helper to produce a sanitized `output/missing_context.yaml` if generation fails — it guides what you may safely add.
- Run template validation to catch accidental references to critical variables before building.

## Troubleshooting

- Missing value after applying fallbacks: confirm the variable name matches the template (dot-notation must match) and verify it is not marked critical.
- Dynamic handler errors: check logs; handlers run at apply-time and exceptions are logged.

## See also

- `site/docs/no-fallback-policy.md` — why hardware IDs must never be faked
- `site/docs/device-cloning.md` — full device cloning flow and where fallbacks fit in

````
