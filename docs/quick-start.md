# Quick Start Guide

Get up and running with PCILeech Firmware Generator in just a few minutes! This guide assumes you have already completed the [installation](installation.md).

## 🎯 Overview

This tutorial will walk you through:

1. Setting up a donor device
2. Generating your first firmware
3. Understanding the output
4. Optional: Flashing to an FPGA

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ PCILeech Firmware Generator installed
- ✅ At least one PCIe device bound to VFIO
- ✅ Appropriate permissions (member of `vfio` group)
- ✅ (Optional) Xilinx Vivado installed for synthesis

## Step 1: List Available Devices

First, let's see what devices are available for extraction:

```bash
# List all PCIe devices
pcileech-generate --list-devices

# Example output:
# Available VFIO devices:
# 0000:01:00.0 - Intel Corporation 82599ES 10-Gigabit SFI/SFP+ Network Connection
# 0000:02:00.0 - NVIDIA Corporation TU106 [GeForce RTX 2060]
# 0000:03:00.0 - Samsung Electronics Co Ltd NVMe SSD Controller SM981/PM981/PM983
```

!!! tip "No devices shown?"
    If no devices appear, check your [VFIO setup](installation.md#vfio-setup) and ensure devices are properly bound.

## Step 2: Choose Your Target Board

List supported FPGA boards:

```bash
# Show available board configurations
pcileech-generate --list-boards

# Example output:
# Available board configurations:
# - pcileech_100t484_x1    - Artix-7 100T, 484 BGA, PCIe x1
# - pcileech_35t325_x4     - Artix-7 35T, 325 BGA, PCIe x4  
# - pcileech_75t484_x1     - Artix-7 75T, 484 BGA, PCIe x1
```

## Step 3: Generate Your First Firmware

Now let's generate firmware using a donor device:

### Basic Generation

```bash
# Generate firmware from Intel network card to Artix-7 100T board
pcileech-generate \
  --device 0000:01:00.0 \
  --board pcileech_100t484_x1 \
  --output my_first_firmware

# The generator will:
# 1. Extract device configuration via VFIO
# 2. Analyze PCIe capabilities
# 3. Generate SystemVerilog files
# 4. Create Vivado project files
# 5. Save everything to ./my_first_firmware/
```

### With Interactive TUI

For a guided experience, use the Terminal User Interface:

```bash
# Launch interactive mode
pcileech-generate --tui

# Follow the prompts to:
# - Select donor device
# - Choose target board
# - Configure options
# - Generate firmware
```

### Advanced Options

```bash
# Generate with custom options
pcileech-generate \
  --device 0000:01:00.0 \
  --board pcileech_100t484_x1 \
  --output custom_firmware \
  --device-id 0x1234 \
  --vendor-id 0x8086 \
  --unique \
  --verbose
```

## Step 4: Understanding the Output

After generation, you'll find several important files:

```
my_first_firmware/
├── pcileech_top.sv           # Top-level SystemVerilog module
├── pcileech_tlps128_bar.sv   # BAR controller implementation
├── config_space_init.hex     # Configuration space initialization
├── vivado_project.tcl        # Vivado project script
├── build_instructions.md     # How to build the project
├── device_info.json          # Extracted device information
└── logs/
    ├── generation.log        # Detailed generation log
    └── vfio_extraction.log   # VFIO extraction details
```

### Key Files Explained

- **`pcileech_top.sv`**: The main FPGA design file
- **`config_space_init.hex`**: Device configuration data for BRAM initialization
- **`vivado_project.tcl`**: Ready-to-use Vivado project script
- **`device_info.json`**: Complete device analysis and extracted data

## Step 5: Verify Generation Success

Check that generation completed successfully:

```bash
# Verify output files
ls -la my_first_firmware/

# Check generation log for any issues
cat my_first_firmware/logs/generation.log | grep -i error

# Validate SystemVerilog syntax (requires Vivado)
pcileech-generate --validate my_first_firmware/
```

## Step 6: Build FPGA Bitstream (Optional)

If you have Xilinx Vivado installed, you can synthesize the design:

```bash
# Navigate to output directory
cd my_first_firmware/

# Run Vivado synthesis
vivado -mode batch -source vivado_project.tcl

# Or use the generator's build command
pcileech-generate --build .

# The bitstream will be saved as:
# - project.runs/impl_1/pcileech_top.bit
```

## Step 7: Flash to FPGA (Optional)

If you have a compatible FPGA board and USB-JTAG programmer:

```bash
# Flash the generated firmware directly
pcileech-generate \
  --device 0000:01:00.0 \
  --board pcileech_100t484_x1 \
  --flash

# Or flash an existing bitstream
pcileech-generate --flash-bitstream my_first_firmware/pcileech_top.bit
```

## 🎛️ Interactive TUI Mode

For beginners, the TUI provides a user-friendly interface:

```bash
# Launch TUI
pcileech-generate --tui
```

The TUI will guide you through:

1. **Device Selection**: Browse and select from available VFIO devices
2. **Board Configuration**: Choose your target FPGA board
3. **Generation Options**: Configure device IDs, uniqueness, etc.
4. **Progress Monitoring**: Real-time generation progress
5. **Result Review**: Summary of generated files and next steps

## 🔧 Common Use Cases

### Network Card Cloning

```bash
# Clone Intel 10G network card
pcileech-generate \
  --device 0000:01:00.0 \
  --board pcileech_100t484_x1 \
  --unique \
  --output intel_10g_clone
```

### NVMe Storage Controller

```bash
# Clone Samsung NVMe controller
pcileech-generate \
  --device 0000:03:00.0 \
  --board pcileech_35t325_x4 \
  --output nvme_controller
```

### Custom Device ID

```bash
# Generate with custom IDs
pcileech-generate \
  --device 0000:01:00.0 \
  --board pcileech_100t484_x1 \
  --vendor-id 0x1234 \
  --device-id 0x5678 \
  --output custom_device
```

## 🐛 Troubleshooting Quick Fixes

### "No VFIO devices found"

```bash
# Check VFIO module is loaded
lsmod | grep vfio

# Verify device is bound to VFIO
ls /sys/bus/pci/drivers/vfio-pci/
```

### "Permission denied accessing device"

```bash
# Check group membership
groups | grep vfio

# Add user to vfio group if needed
sudo usermod -a -G vfio $USER
# Log out and back in
```

### "Vivado not found"

```bash
# Source Vivado environment
source /opt/Xilinx/Vivado/*/settings64.sh

# Or add to your shell profile
echo 'source /opt/Xilinx/Vivado/2023.1/settings64.sh' >> ~/.bashrc
```

## ✨ Tips for Success

### 1. Choose the Right Donor Device
- Simple devices (network cards) are easier than complex ones (GPUs)
- Ensure the device has standard PCIe capabilities
- Check that VFIO can access all configuration space

### 2. Match PCIe Lane Count
- Use x1 boards for x1 devices
- Use x4 boards for high-bandwidth devices
- Consider the target use case for lane count selection

### 3. Verify Before Building
- Always check the generation log for warnings
- Validate device information in `device_info.json`
- Test with simulation before hardware synthesis

### 4. Keep Unique Identifiers
- Use `--unique` flag to generate unique device/vendor IDs
- This prevents conflicts with real hardware
- Important for security research applications

## 🎓 Next Steps

Now that you've generated your first firmware:

1. **[Device Cloning Guide](device-cloning.md)**: Learn advanced device extraction techniques
2. **[Template Architecture](template-architecture.md)**: Understand how the generation works
3. **[Development Guide](development.md)**: Contribute to the project
4. **[Troubleshooting](troubleshooting.md)**: Fix common issues

## 📚 Additional Resources

- **[Configuration Space Documentation](config-space-shadow.md)**: Deep dive into PCIe config space handling
- **[Supported Devices](supported-devices.md)**: Full list of tested devices
- **[TUI Guide](tui-readme.md)**: Complete TUI interface documentation

---

**Questions?** Check our [Troubleshooting Guide](troubleshooting.md) or join the [Discord Community](https://discord.gg/your-server)!
