---
layout: default
title: "Home"
---

# PCILeech Firmware Generator

[![CI](https://github.com/ramseymcgrath/PCILeechFWGenerator/workflows/CI/badge.svg)](https://github.com/ramseymcgrath/PCILeechFWGenerator/actions)
[![codecov](https://codecov.io/gh/ramseymcgrath/PCILeechFWGenerator/branch/main/graph/badge.svg)](https://codecov.io/gh/ramseymcgrath/PCILeechFWGenerator)
![](https://dcbadge.limes.pink/api/shield/429866199833247744)


Generate authentic PCIe DMA firmware from real donor hardware with a single command. This tool extracts donor configurations from a local device and generates unique PCILeech FPGA bitstreams (and optionally flashes a DMA card over USB-JTAG).

> **Warning:** This tool requires *real* hardware. The templates are built using the device identifiers directly from a donor card and placeholder values are explicitly avoided. Using your own donor device ensures your firmware will be unique.

## ✨ Key Features

- **Donor Hardware Analysis**: Extract real PCIe device configurations and register maps from live hardware via VFIO
- **Dynamic Device Capabilities**: Generate realistic network, storage, media, and USB controller capabilities with pattern-based analysis
- **Full 4KB Config-Space Shadow**: Complete configuration space emulation with BRAM-based overlay memory
- **MSI-X Table Replication**: Exact replication of MSI-X tables from donor devices with interrupt delivery logic
- **Deterministic Variance Seeding**: Consistent hardware variance based on device serial number for unique firmware
- **Advanced SystemVerilog Generation**: Comprehensive PCIe device controller with modular template architecture
- **Active Device Interrupts**: MSI-X interrupt controller with timer-based and event-driven interrupt generation
- **Memory Overlay Mapping**: BAR dispatcher with configurable memory regions and custom PIO windows
- **Interactive TUI**: Modern Textual-based interface with real-time device monitoring and guided workflows
- **Containerized Build Pipeline**: Podman-based synthesis environment with automated VFIO setup
- **Automated Testing and Validation**: Comprehensive test suite with SystemVerilog assertions and Python unit tests
- **USB-JTAG Flashing**: Direct firmware deployment to DMA boards via integrated flash utilities

📚 **[Complete Documentation](.)** | 🏗️ **[Device Cloning Guide](device-cloning.md)** | 🔧 **[Development Setup](development.md)** | 🛠️ **[Troubleshooting](troubleshooting.md)** | 🔐 **[Security Policy](no-fallback-policy.md)**

## 🚀 Quick Start

### Installation

```bash
# Install with TUI support (recommended)
pip install pcileechfwgenerator[tui]

# Load required kernel modules
sudo modprobe vfio vfio-pci
```

### Requirements

- **Python ≥ 3.9**
- **Donor PCIe card** (any inexpensive NIC, sound, or capture card)
- **Linux OS** (You need this)

### Optional Requirements

- **Podman** (_not Docker_ - required for proper PCIe device mounting) You use podman or run the python locally. *You must use linux for either option
- **DMA board** (pcileech_75t484_x1, pcileech_35t325_x4, or pcileech_100t484_x1) You don't need to flash your firmware with this tooling but you can.
- **Vivado Studio** (2022.2+ for synthesis and bitstream generation) You can use a locally generated Vivado project or insert the files into an existing one.


### Basic Usage

```bash
# Interactive TUI (recommended for first-time users)
sudo python3 pcileech.py tui

# CLI interface for scripted builds
sudo python3 pcileech.py build --bdf 0000:03:00.0 --board pcileech_35t325_x1

# Check VFIO configuration
sudo python3 pcileech.py check --device 0000:03:00.0

# Flash firmware to device
sudo python3 pcileech.py flash output/firmware.bin
```


### Development from Repository

```bash
git clone https://github.com/ramseymcgrath/PCILeechFWGenerator.git
cd PCILeechFWGenerator
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
sudo -E python3 pcileech.py tui
```

## 🔧 Troubleshooting


### VFIO Setup Issues

> **Warning:** Avoid using on-board devices (audio, graphics cards) for donor info. The VFIO process can lock the bus during extraction and cause system reboots.


The most common issues involve VFIO (Virtual Function I/O) configuration. Use the built-in diagnostic tool:

```bash
# Check VFIO setup and device compatibility
sudo python3 pcileech.py check

# Check a specific device
sudo python3 pcileech.py check --device 0000:03:00.0

# Interactive mode with guided fixes
sudo python3 pcileech.py check --interactive

# Attempt automatic fixes
sudo python3 pcileech.py check --fix
```

### Common VFIO Problems

**1. IOMMU not enabled in BIOS/UEFI**
```bash
# Enable VT-d (Intel) or AMD-Vi (AMD) in BIOS settings
# Then add to /etc/default/grub GRUB_CMDLINE_LINUX:
# For Intel: intel_iommu=on
# For AMD: amd_iommu=on
sudo update-grub && sudo reboot
```

**2. VFIO modules not loaded**
```bash
sudo modprobe vfio vfio_pci vfio_iommu_type1
```

**3. Device not in IOMMU group**
```bash
# Check IOMMU groups
find /sys/kernel/iommu_groups/ -name '*' -type l | grep YOUR_DEVICE_BDF
```

**4. Permission issues**
```bash
# Add user to required groups
sudo usermod -a -G vfio $USER
sudo usermod -a -G dialout $USER  # For USB-JTAG access
```

**5. ACS (Access Control Services) errors**
```bash
# Devices sharing IOMMU groups - common on Ubuntu
# See diagnostic tool output for solutions
```

### Installation Issues

```bash
# If pip installation fails
pip install --upgrade pip setuptools wheel
pip install pcileechfwgenerator[tui]

# For TUI dependencies
pip install textual rich psutil watchdog

# Container issues
podman --version
podman info | grep rootless
```

> **Note:** If you run into issues with your vivado project file formatting, first clear out all your cached files and rerun. Otherwise try pulling a copy of the pcileech repo directly and then inserting the generator output in. 

## 📚 Documentation

For detailed information, browse the sections below or visit our complete documentation:

### Core Features & Architecture

- **[Device Cloning Process](device-cloning.md)** - Complete guide to the cloning workflow
- **[Configuration Space Shadow](config-space-shadow.md)** - Understanding the configuration space shadow mechanism
- **[Template Architecture](template-architecture.md)** - Explore the template-based design system
- **[Dynamic Device Capabilities](dynamic-device-capabilities.md)** - Advanced PCIe device capability generation
- **[Firmware Authenticity & Stability](firmware-uniqueness.md)** - Ensuring firmware integrity and reliability
- **[No-Fallback Security Policy](no-fallback-policy.md)** - Security policy preventing generic firmware
- **[Supported Devices](supported-devices.md)** - View all compatible hardware devices

### Guides & Tutorials

- **[Manual Donor Dump](manual-donor-dump.md)** - Step-by-step manual extraction guide
- **[TUI Interface Guide](tui-readme.md)** - Using the Terminal User Interface
- **[Development Guide](development.md)** - Contributing to PCILeech Firmware Generator
- **[Troubleshooting Guide](troubleshooting.md)** - Common issues and solutions

### External Resources

- **[PCILeech Main Project](https://github.com/ufrisk/pcileech)** - Visit the main PCILeech project
- **[PCILeech FPGA](https://github.com/ufrisk/pcileech-fpga)** - PCILeech FPGA implementation
- **[Issues Tracker](https://github.com/ramseymcgrath/PCILeechFWGenerator/issues)** - Report bugs or request features
- **[Community Forum](https://github.com/ramseymcgrath/PCILeechFWGenerator/discussions)** - Join the community discussions

## 🧹 Cleanup & Safety

- **Rebind donors**: Use TUI/CLI to rebind donor devices to original drivers
- **Keep firmware private**: Generated firmware contains real device identifiers
- **Use isolated build environments**: Never build on production systems
- **Container cleanup**: `podman rmi pcileechfwgenerator:latest`

> **Important:** This tool is intended for educational research and legitimate PCIe development purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations. The authors assume no liability for misuse of this software.

## 🏆 Acknowledgments

- **PCILeech Community**: For feedback and contributions
- @Simonrak for the writemask implementation

## 📄 License

This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Notice

*AGAIN* This tool is intended for educational research and legitimate PCIe development purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations. The authors assume no liability for misuse of this software.

**Security Considerations:**

- Never build firmware on systems used for production or sensitive operations
- Use isolated build environments (Seperate dedicated hardware)
- Keep generated firmware private and secure
- Follow responsible disclosure practices for any security research
- Use the SECURITY.md template to raise security concerns

## 🗂️ Site Navigation

- 📋 **[Site Map](sitemap.md)** - Complete index of all documentation pages
- 🔍 **[Search](search.md)** - Search all documentation content
- 📖 **[API Documentation](docs/)** - Auto-generated Python API reference

---
