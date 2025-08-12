# Installation Guide

This guide will walk you through installing the PCILeech Firmware Generator on your system.

## System Requirements

### Operating System
- **Linux**: Ubuntu 20.04+ (recommended), Debian 11+, RHEL 8+, or similar (Required)
- **Python**: 3.9 or higher (3.8+ supported)
- **Memory**: 4GB RAM minimum, 8GB recommended for complex devices
- **Storage**: 2GB free space for FPGA tools and generated firmware

### Hardware Requirements
- **Donor PCIe Device**: Any inexpensive PCIe device (NIC, sound card, capture card) for configuration extraction
- **FPGA Development Board**: Optional - Supported Xilinx board for flashing (see [Supported Devices](supported-devices.md))
- **USB-JTAG Programmer**: Optional - For FPGA programming (Xilinx Platform Cable or compatible)

## Installation Methods

### Method 1: Install from PyPI (Recommended)

```bash
# Install the latest stable release with TUI support
pip install PCILeechFWGenerator[tui]

# Or install basic version without TUI
pip install PCILeechFWGenerator

# Verify installation
python3 -m pcileech --version
```

### Method 2: Install from Source

```bash
# Clone the repository
git clone https://github.com/ramseymcgrath/PCILeechFWGenerator.git
cd PCILeechFWGenerator

# Create virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install in development mode
pip install -e .

# Or install with TUI support
pip install -e .[tui]
```

### Method 3: Using Podman (Recommended for Synthesis)

```bash
# Pull the container image
podman pull ghcr.io/ramseymcgrath/pcileechfwgenerator:latest

# Run with current directory mounted and device access
podman run -it --rm \
  -v $(pwd):/workspace \
  -v /dev:/dev \
  --privileged \
  ghcr.io/ramseymcgrath/pcileechfwgenerator:latest
```

> **Note**: Use Podman instead of Docker for proper PCIe device mounting and VFIO support.

## VFIO Setup

The generator requires VFIO drivers to access donor devices. Here's how to set them up:

### 1. Enable IOMMU

Add to your kernel command line (usually in `/etc/default/grub`):

```bash
# For Intel CPUs
GRUB_CMDLINE_LINUX="intel_iommu=on iommu=pt"

# For AMD CPUs
GRUB_CMDLINE_LINUX="amd_iommu=on iommu=pt"
```

Update GRUB and reboot:

```bash
sudo update-grub
sudo reboot
```

### 2. Load VFIO Modules

```bash
# Load required modules
sudo modprobe vfio vfio-pci vfio-iommu-type1

# Make persistent (add to /etc/modules)
echo "vfio" | sudo tee -a /etc/modules
echo "vfio-pci" | sudo tee -a /etc/modules
echo "vfio-iommu-type1" | sudo tee -a /etc/modules
```

### 3. Bind Device to VFIO

Find your device:

```bash
# List PCIe devices
lspci -nn

# Example output:
# 01:00.0 Ethernet controller [0200]: Intel Corporation 82599ES [8086:10fb]
```

Bind to VFIO:

```bash
# Replace with your device ID and vendor:device codes
echo "8086 10fb" | sudo tee /sys/bus/pci/drivers/vfio-pci/new_id
echo "0000:01:00.0" | sudo tee /sys/bus/pci/devices/0000:01:00.0/driver/unbind
echo "0000:01:00.0" | sudo tee /sys/bus/pci/drivers/vfio-pci/bind
```

> **Tip**: The PCILeech tool can help automate VFIO setup. Use `python3 pcileech.py check --device 0000:01:00.0` for guided setup.

## Xilinx Vivado Setup (Optional)

For FPGA synthesis and programming, install Xilinx Vivado:

### 1. Download Vivado

- Visit [Xilinx Downloads](https://www.xilinx.com/support/download.html)
- Download Vivado ML Edition (2020.1 or later)
- Choose WebPACK (free) or Standard/Enterprise edition

### 2. Install Vivado

```bash
# Extract and run installer
tar -xvf Xilinx_Unified_*.tar.gz
cd Xilinx_Unified_*/
sudo ./xsetup
```

### 3. Setup Environment

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Xilinx Vivado
source /opt/Xilinx/Vivado/2023.1/settings64.sh  # Adjust version
export PATH=$PATH:/opt/Xilinx/Vivado/2023.1/bin
```

## USB-JTAG Driver Setup (Optional)

For programming FPGAs via USB-JTAG:

### 1. Install Cable Drivers

```bash
# For Xilinx Platform Cable
cd /opt/Xilinx/Vivado/2023.1/data/xicom/cable_drivers/lin64/install_script/install_drivers
sudo ./install_drivers

# For Digilent cables
wget https://github.com/Digilent/digilent.adept.runtime/releases/download/v2.27.9/digilent.adept.runtime_2.27.9-amd64.deb
sudo dpkg -i digilent.adept.runtime_2.27.9-amd64.deb
```

### 2. Setup udev Rules

Create `/etc/udev/rules.d/52-xilinx-ftdi-usb.rules`:

```bash
# Xilinx USB cables
SUBSYSTEM=="usb", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6010", GROUP="plugdev"
SUBSYSTEM=="usb", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6014", GROUP="plugdev"

# Digilent cables
SUBSYSTEM=="usb", ATTRS{idVendor}=="1443", GROUP="plugdev"
```

Reload udev rules:

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## Verification

Verify your installation:

```bash
# Check basic installation
python3 pcileech.py --help

# Check VFIO access (requires bound device)
sudo python3 pcileech.py check --device 0000:01:00.0

# Launch interactive TUI
sudo python3 pcileech.py tui

# Check Vivado integration (if installed)
python3 pcileech.py build --help

# Run version check
python3 pcileech.py version
```

## Troubleshooting

### Common Issues

#### Permission Denied

```bash
# Add user to vfio group
sudo usermod -a -G vfio $USER

# Add user to plugdev group (for USB-JTAG)
sudo usermod -a -G plugdev $USER

# Logout and login again
```

#### IOMMU Not Available

```bash
# Check IOMMU status
dmesg | grep -i iommu

# Verify kernel command line
cat /proc/cmdline
```

#### Device Not Found

```bash
# Check device binding
ls -la /sys/bus/pci/drivers/vfio-pci/

# Check IOMMU groups
find /sys/kernel/iommu_groups/ -type l
```

#### Vivado Not Found

```bash
# Check Vivado installation
which vivado

# Source Vivado settings
source /opt/Xilinx/Vivado/*/settings64.sh
```

### Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](troubleshooting.md)
2. Review the [FAQ](https://github.com/ramseymcgrath/PCILeechFWGenerator/wiki/FAQ)
3. Search existing [GitHub Issues](https://github.com/ramseymcgrath/PCILeechFWGenerator/issues)
4. Use the built-in diagnostic tool: `sudo python3 pcileech.py check --device <BDF> --interactive`
5. Create a new issue with detailed logs and system information

### Additional Diagnostic Commands

```bash
# Quick diagnostic for VFIO setup
sudo python3 pcileech.py check --device 0000:03:00.0 --interactive

# Check automatic update system
python3 pcileech.py version

# Generate donor template for troubleshooting
sudo python3 pcileech.py donor-template --save-to debug_info.json
```

## Next Steps

Once installation is complete:

1. **[Quick Start Guide](quick-start.md)**: Generate your first firmware
2. **[TUI Documentation](tui-readme.md)**: Learn the interactive interface
3. **[Device Cloning](device-cloning.md)**: Learn about device extraction
4. **[Troubleshooting Guide](troubleshooting.md)**: Common issues and solutions
5. **[Development Guide](development.md)**: Contributing to the project

### Environment Variables

You can customize behavior with these environment variables:

- `PCILEECH_AUTO_INSTALL=1` - Automatically install missing dependencies
- `PCILEECH_DISABLE_UPDATE_CHECK=1` - Disable automatic version checking
- `PCILEECH_CACHE_DIR` - Custom cache directory for repositories

---

**Ready to generate firmware?** Continue to the [Quick Start Guide](quick-start.md)!
