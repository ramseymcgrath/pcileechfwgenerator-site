---
layout: page
title: "Development Guide"
---

# 🛠️ Development Guide

The code needs to run on linux but can be developed anywhere with a python vers >3.9

```bash
# Clone repository
git clone https://github.com/ramseymcgrath/PCILeechFWGenerator
cd PCILeechFWGenerator

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Run tests
pytest tests/
```

## 📦 Building from Source

```bash
# Build distributions
python -m build

# Install locally
pip install dist/*.whl

```

## Unit testing

TUI Tests are next to the code in the tui dir, app tests are in the tests/ dir.
`make test` in the repo is the easiest way to run unit tests locally. The github action will run them in CI.

## 🤝 Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](../CONTRIBUTING.md) for detailed guidelines.

**Quick Start:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run the test suite (`pytest`)
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 🧪 Testing

The project uses pytest for testing. Run the test suite with:

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_specific_module.py

# Run with coverage
pytest --cov=src tests/
```

### SystemVerilog Template Validation

To ensure SystemVerilog compatibility and prevent synthesis errors, the project includes validation scripts for templates:

```bash
# Validate SystemVerilog templates for syntax issues
./scripts/validate_systemverilog_templates.py

# Check that project templates use SystemVerilog (not Verilog)
./scripts/validate_project_systemverilog.py
```

These validations are automatically run in CI to catch issues like:
- Missing `module`/`endmodule` declarations
- Standalone `input`/`output` declarations outside module ports
- Project templates configured for Verilog instead of SystemVerilog
- Inconsistent use of SystemVerilog vs Verilog constructs

The validation helps maintain compatibility with Vivado synthesis and prevents common template errors.

## 📝 Code Style

This project follows these coding standards:

- PEP 8 for Python code style
- Black for code formatting
- isort for import sorting
- flake8 for linting
- mypy for type checking

Pre-commit hooks are configured to enforce these standards.

## 🔧 Device Driver Management

### VFIO-PCI Binding

The firmware generator manages PCIe device drivers during the build process. Here are some important implementation details:

- **Driver Detection**: The system checks the current driver bound to a device before attempting to bind it to vfio-pci
- **Automatic Skip**: If a device is already bound to vfio-pci, the binding process is skipped automatically
- **Error Handling**: Even if the bind command fails but the device is actually bound to vfio-pci, the system will detect this and continue
- **Driver Restoration**: After the build completes, the system attempts to restore the original driver

This approach ensures smooth operation even in edge cases like:
- Multiple consecutive builds using the same device
- Manual pre-binding of devices to vfio-pci
- Race conditions during driver binding

## ⚠️ Disclaimer

This tool is intended for educational research and legitimate PCIe development purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations. The authors assume no liability for misuse of this software.

---

**Version 0.5.0** - Major release with TUI interface and professional packaging