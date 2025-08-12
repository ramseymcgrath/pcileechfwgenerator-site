# Quick Start Guide

Get up and running with PCILeech Firmware Generator in just a few minutes! This guide assumes you have already completed the [installation](installation.md).

## 🎯 Overview

This tutorial will walk you through:

1. Setting up a donor device with VFIO
2. Generating your first firmware
3. Understanding the output
4. Optional: Building and flashing to an FPGA

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ PCILeech Firmware Generator installed
- ✅ Linux operating system (required)
- ✅ Root/sudo access (required for VFIO operations)
- ✅ At least one PCIe device available for extraction
- ✅ VFIO kernel modules available
- ✅ (Optional) Xilinx Vivado installed for synthesis

## Step 1: Check VFIO Configuration

First, let's verify your system is properly configured for VFIO:

```bash
# Check VFIO setup and get device recommendations
sudo python3 pcileech.py check

# Check specific device
sudo python3 pcileech.py check --device 0000:03:00.0

# Interactive setup assistance
sudo python3 pcileech.py check --interactive
```

!!! tip "VFIO Issues?"
    If you encounter VFIO setup problems, the check command will provide specific remediation steps. Run with `--fix` to automatically apply fixes.

## Step 2: Choose Your Target Board

The generator supports three FPGA board configurations:

| Board | FPGA | PCIe Lanes | Use Case |
|-------|------|------------|----------|
| `pcileech_35t325_x4` | Artix-7 35T | x4 | High-bandwidth devices |
| `pcileech_75t484_x1` | Artix-7 75T | x1 | Standard devices |
| `pcileech_100t484_x1` | Artix-7 100T | x1 | Complex devices |

## Step 3: Generate Your First Firmware

Now let's generate firmware using a donor device:

### Interactive TUI (Recommended)

For a guided experience, use the Terminal User Interface:

```bash
# Launch interactive mode
sudo python3 pcileech.py tui

# The TUI will guide you through:
# - Device selection and VFIO binding
# - Board configuration
# - Generation options
# - Real-time progress monitoring
```

### CLI Generation

For scripted builds or automation:

```bash
# Basic firmware generation
sudo python3 pcileech.py build \
  --bdf 0000:03:00.0 \
  --board pcileech_35t325_x4

# Advanced generation with custom options
sudo python3 pcileech.py build \
  --bdf 0000:03:00.0 \
  --board pcileech_35t325_x4 \
  --advanced-sv \
  --enable-variance \
  --build-dir my_firmware

# Generate with Vivado build settings
sudo python3 pcileech.py build \
  --bdf 0000:03:00.0 \
  --board pcileech_35t325_x4 \
  --vivado-path /tools/Xilinx/2025.1/Vivado \
  --vivado-jobs 8 \
  --vivado-timeout 7200
```

### Donor Template Mode

For advanced device cloning with custom configurations:

```bash
# Generate a donor template first
sudo python3 pcileech.py donor-template \
  --bdf 0000:03:00.0 \
  --save-to my_device.json

# Edit the template to customize device behavior
# Then use it for generation
sudo python3 pcileech.py build \
  --bdf 0000:03:00.0 \
  --board pcileech_35t325_x4 \
  --donor-template my_device.json
```

## Step 4: Understanding the Output

After generation, you'll find several important files in the build directory (default: `build/`):

```text
build/
├── src/
│   ├── pcileech_top.sv              # Top-level SystemVerilog module
│   ├── pcileech_tlps128_bar.sv      # BAR controller implementation
│   ├── pcileech_pcie_cfg_space.sv   # Configuration space controller
│   └── ...                          # Additional SystemVerilog modules
├── constraints/
│   └── pcileech_35t325_x4.xdc       # Board-specific pin constraints
├── tcl/
│   └── build_project.tcl            # Vivado project generation script
├── config/
│   ├── config_space_init.hex        # Configuration space initialization
│   └── device_info.json             # Extracted device information
├── docs/
│   └── build_instructions.md        # Build and deployment guide
└── logs/
    ├── generation.log               # Detailed generation log
    └── vfio_extraction.log          # VFIO extraction details
```

### Key Files Explained

- **`src/pcileech_top.sv`**: The main FPGA design file containing the PCIe interface
- **`config/config_space_init.hex`**: Device configuration data for BRAM initialization
- **`tcl/build_project.tcl`**: Ready-to-use Vivado project creation script
- **`config/device_info.json`**: Complete device analysis and extracted capabilities
- **`docs/build_instructions.md`**: Step-by-step instructions for building and deployment

## Step 5: Verify Generation Success

Check that generation completed successfully:

```bash
# Check the build directory
ls -la build/

# Verify critical files exist
ls build/src/pcileech_top.sv
ls build/config/device_info.json
ls build/tcl/build_project.tcl

# Check generation log for any issues
grep -i "error\|warning" build/logs/generation.log

# View device information
cat build/config/device_info.json | python3 -m json.tool
```

## Step 6: Build FPGA Bitstream (Optional)

If you have Xilinx Vivado installed, you can synthesize the design:

```bash
# Source Vivado environment first
source /opt/Xilinx/Vivado/2023.1/settings64.sh

# Navigate to build directory
cd build/

# Create and build Vivado project
vivado -mode batch -source tcl/build_project.tcl

# Check for successful build
ls -la vivado_project/pcileech_project.runs/impl_1/pcileech_top.bit
```

For automated building with custom Vivado settings, you can specify paths during generation:

```bash
sudo python3 pcileech.py build \
  --bdf 0000:03:00.0 \
  --board pcileech_35t325_x4 \
  --vivado-path /opt/Xilinx/Vivado/2023.1 \
  --vivado-jobs 8
```

## Step 7: Flash to FPGA (Optional)

If you have a compatible FPGA board and USB-JTAG programmer:

```bash
# Flash the generated bitstream
sudo python3 pcileech.py flash build/vivado_project/pcileech_project.runs/impl_1/pcileech_top.bit

# Or use external tools like OpenOCD or Vivado Hardware Manager
```

## 🎛️ Interactive TUI Mode

The TUI provides a comprehensive, user-friendly interface for all operations:

```bash
# Launch TUI with automatic requirements check
sudo python3 pcileech.py tui
```

The TUI interface includes:

1. **Device Management**: Browse, bind, and unbind PCIe devices
2. **VFIO Configuration**: Automatic VFIO setup and validation
3. **Build Configuration**: Interactive board and option selection
4. **Progress Monitoring**: Real-time generation progress with detailed logs
5. **Donor Templates**: Template creation and validation tools
6. **Build Management**: Vivado integration and build monitoring
7. **Flash Tools**: Direct firmware deployment to FPGA boards

### TUI Features

- **Real-time Device Monitoring**: Live PCIe device status and VFIO binding state
- **Guided Workflows**: Step-by-step assistance for complex operations
- **Error Handling**: Automatic error detection with remediation suggestions
- **Log Viewer**: Integrated log viewing with filtering and search
- **Configuration Profiles**: Save and load common build configurations

## 🔧 Common Use Cases

### Network Card Cloning

```bash
# Clone Intel network card for x4 board
sudo python3 pcileech.py build \
  --bdf 0000:01:00.0 \
  --board pcileech_35t325_x4 \
  --device-type network \
  --advanced-sv

# Generate with variance for uniqueness
sudo python3 pcileech.py build \
  --bdf 0000:01:00.0 \
  --board pcileech_35t325_x4 \
  --enable-variance
```

### NVMe Storage Controller

```bash
# Clone NVMe controller (typically requires x4 board)
sudo python3 pcileech.py build \
  --bdf 0000:03:00.0 \
  --board pcileech_35t325_x4 \
  --device-type storage \
  --build-dir nvme_firmware
```

### USB Controller Cloning

```bash
# Clone USB controller
sudo python3 pcileech.py build \
  --bdf 0000:05:00.0 \
  --board pcileech_75t484_x1 \
  --device-type generic
```

### Custom Device with Template

```bash
# Create custom donor template
sudo python3 pcileech.py donor-template \
  --bdf 0000:02:00.0 \
  --save-to custom_device.json

# Edit the template file to customize behavior
# Then build with the template
sudo python3 pcileech.py build \
  --bdf 0000:02:00.0 \
  --board pcileech_100t484_x1 \
  --donor-template custom_device.json
```

## 🐛 Troubleshooting Quick Fixes

### "VFIO not properly configured"

```bash
# Run comprehensive VFIO diagnostics
sudo python3 pcileech.py check --interactive

# Auto-fix common VFIO issues
sudo python3 pcileech.py check --fix

# Check specific device
sudo python3 pcileech.py check --device 0000:03:00.0
```

### "Permission denied" or "Root privileges required"

```bash
# PCILeech requires root for VFIO operations
sudo python3 pcileech.py tui

# Check VFIO group access
ls -la /dev/vfio/
groups | grep vfio
```

### "No suitable devices found"

```bash
# List all PCIe devices
lspci -nn

# Check device power state
sudo lspci -vvv -s 0000:03:00.0 | grep -i power

# Try different device types
sudo python3 pcileech.py check
```

### "Vivado not found" or Build Issues

```bash
# Source Vivado environment
source /opt/Xilinx/Vivado/2023.1/settings64.sh

# Specify Vivado path explicitly
sudo python3 pcileech.py build \
  --bdf 0000:03:00.0 \
  --board pcileech_35t325_x4 \
  --vivado-path /opt/Xilinx/Vivado/2023.1

# Check Vivado installation
which vivado
```

### "Generation failed" or Module Import Errors

```bash
# Check Python environment and dependencies
python3 -c "import textual, rich, psutil; print('Dependencies OK')"

# Reinstall with all dependencies
pip install --upgrade pcileechfwgenerator[tui]

# Development mode installation
pip install -r requirements.txt
```

## ✨ Tips for Success

### 1. Choose the Right Donor Device

- Simple devices (network cards) are easier than complex ones (GPUs)
- Ensure the device has standard PCIe capabilities
- Check that VFIO can access all configuration space
- Avoid devices with complex power management

### 2. Match PCIe Lane Count

- Use x1 boards for x1 devices
- Use x4 boards for high-bandwidth devices
- Consider the target use case for lane count selection
- Most network cards work well with x1 boards

### 3. Verify Before Building

- Always check the generation log for warnings
- Validate device information in `device_info.json`
- Test with simulation before hardware synthesis
- Use the check command to validate VFIO setup

### 4. Use Unique Configurations

- Enable variance for unique device identifiers
- Consider using donor templates for custom behavior
- Test generated firmware thoroughly before deployment
- Keep device information secure and private

## 🎓 Next Steps

Now that you've generated your first firmware:

1. **[Device Cloning Guide](device-cloning.md)**: Learn advanced device extraction techniques
2. **[Template Architecture](template-architecture.md)**: Understand how the generation works
3. **[Development Guide](development.md)**: Contribute to the project
4. **[Troubleshooting](troubleshooting.md)**: Fix common issues
5. **[TUI Documentation](tui-readme.md)**: Master the interactive interface

## 📚 Additional Resources

- **[Configuration Space Documentation](config-space-shadow.md)**: Deep dive into PCIe config space handling
- **[Supported Devices](supported-devices.md)**: Full list of tested devices
- **[Dynamic Device Capabilities](dynamic-device-capabilities.md)**: Advanced capability generation
- **[Firmware Uniqueness](firmware-uniqueness.md)**: How authentic firmware is created

---

**Questions?** Check our [Troubleshooting Guide](troubleshooting.md) or join the [Discord Community](https://discord.com/users/429866199833247744)!
