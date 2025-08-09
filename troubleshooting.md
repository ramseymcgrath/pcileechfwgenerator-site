---
layout: default
title: Troubleshooting Guide
---

# Troubleshooting Guide

This guide covers common issues and their solutions when using PCILeech Firmware Generator.

## Table of Contents

- [VFIO Setup Issues](#vfio-setup-issues)
- [Installation Issues](#installation-issues)
- [BAR Detection Issues](#bar-detection-issues)
- [VFIO Binding Problems](#vfio-binding-problems)
- [Build Failures](#build-failures)
- [Device-Specific Issues](#device-specific-issues)
- [SystemVerilog Generation Errors](#systemverilog-generation-errors)
- [Getting Help](#getting-help)

## VFIO Setup Issues

> [!WARNING]
> Avoid using on-board devices (audio, graphics cards) for donor info. The VFIO process can lock the bus during extraction and cause system reboots.

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

## Installation Issues

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

> [!NOTE]
> If you run into issues with your vivado project file formatting, first clear out all your cached files and rerun. Otherwise try pulling a copy of the pcileech repo directly and then inserting the generator output in.

## BAR Detection Issues

### Error: "No valid MMIO BARs found - all BARs are either size 0 or I/O-port"

This error occurs when the firmware generator cannot find any memory-mapped I/O (MMIO) BARs on the device. Common causes include:

#### 1. Device in Power Saving State (D3)

**Symptoms:**
- Device shows BARs in `lspci -vvv` but VFIO reports size 0
- Device power state shows D3, D3hot, or D3cold
- Common with wireless cards like Realtek RTL8192EE

**Solution:**

Wake the device before building:

```bash
# Check current power state
cat /sys/bus/pci/devices/0000:XX:XX.X/power_state

# If it shows D3, wake the device:
sudo sh -c 'echo on > /sys/bus/pci/devices/0000:XX:XX.X/power/control'
sudo setpci -s 0000:XX:XX.X CAP_PM+4.b=0

# Verify it's now in D0:
cat /sys/bus/pci/devices/0000:XX:XX.X/power_state
```

**Note:** The firmware generator now includes automatic power state detection and wake functionality (added in v1.x.x).

#### 2. Device Only Has I/O BARs

**Symptoms:**
- All BARs show as "I/O ports" in `lspci -vvv`
- No memory BARs present

**Solution:**
- PCILeech requires at least one memory BAR for DMA operations
- These devices are not compatible with PCILeech

#### 3. VFIO Binding Issues

**Symptoms:**
- BARs show correctly in sysfs but VFIO reports different sizes
- Permission errors when accessing VFIO

**Solution:**
```bash
# Rebind the device to vfio-pci
echo 0000:XX:XX.X > /sys/bus/pci/drivers/vfio-pci/unbind
echo 0000:XX:XX.X > /sys/bus/pci/drivers/vfio-pci/bind
```

### Debugging BAR Issues

To debug BAR detection problems, check the following:

1. **View device BARs:**
   ```bash
   sudo lspci -vvv -s 0000:XX:XX.X | grep -A 20 "Region"
   ```

2. **Check sysfs resources:**
   ```bash
   for i in 0 1 2 3 4 5; do
     echo "BAR$i: $(cat /sys/bus/pci/devices/0000:XX:XX.X/resource$i)"
   done
   ```

3. **Verify power state:**
   ```bash
   cat /sys/bus/pci/devices/0000:XX:XX.X/power_state
   cat /sys/bus/pci/devices/0000:XX:XX.X/power/runtime_status
   ```

## VFIO Binding Problems

### Error: "Device not bound to vfio-pci"

**Solution:**
```bash
# Check current driver
readlink /sys/bus/pci/devices/0000:XX:XX.X/driver

# Unbind from current driver (if any)
echo 0000:XX:XX.X > /sys/bus/pci/devices/0000:XX:XX.X/driver/unbind

# Bind to vfio-pci
echo 0000:XX:XX.X > /sys/bus/pci/drivers/vfio-pci/bind
```

### Error: "IOMMU group not viable"

**Solution:**
1. Ensure IOMMU is enabled in BIOS/UEFI
2. Check kernel parameters include `intel_iommu=on` or `amd_iommu=on`
3. Verify with: `sudo dmesg | grep -i iommu`

## Build Failures

### Container Build Issues

If the container fails to build:

1. **Check Docker/Podman installation:**
   ```bash
   docker --version  # or podman --version
   ```

2. **Clear build cache:**
   ```bash
   docker system prune -a  # or podman system prune -a
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

### Vivado License Issues

If you encounter Vivado licensing errors:

1. Ensure Vivado is installed and licensed
2. Check license server connectivity
3. Verify environment variables are set correctly

## Device-Specific Issues

### Realtek RTL8192EE Wireless Cards

These cards commonly enter D3 power state and report BAR size 0. The firmware generator now automatically handles this, but manual intervention may be needed:

```bash
# Force device to D0 state
sudo setpci -s 0000:XX:XX.X CAP_PM+4.b=0

# Disable runtime power management
echo on > /sys/bus/pci/devices/0000:XX:XX.X/power/control
```

### Intel Network Cards

Some Intel NICs require specific handling:

1. Disable SR-IOV if enabled
2. Ensure the device is not in use by the system
3. Check for firmware updates

### AMD Graphics Cards

Large BAR sizes may cause issues:

1. Enable Above 4G Decoding in BIOS
2. Enable Resizable BAR support
3. Consider using a specific BAR if multiple are present

## SystemVerilog Generation Errors

The SystemVerilog generator includes comprehensive error handling and validation. Here are the most common errors and their solutions:

### Template Rendering Errors

#### Error: "TemplateRenderError: Failed to render SystemVerilog template"

**Cause:** Template file is missing, corrupted, or contains syntax errors.

**Solutions:**
1. **Check template file exists:**
   ```bash
   find src/templates/ -name "*.j2" | grep systemverilog
   ```

2. **Validate template syntax:**
   ```bash
   python3 -c "from jinja2 import Template; Template(open('template_file.j2').read())"
   ```

3. **Clear template cache:**
   ```bash
   rm -rf __pycache__/ src/templating/__pycache__/
   ```

#### Error: "device_config is missing from template context"

**Cause:** Critical device configuration data is missing or invalid.

**Solutions:**
1. **Verify device configuration:**
   ```bash
   # Check device is properly detected
   sudo python3 pcileech.py check --device 0000:XX:XX.X
   ```

2. **Ensure device has valid vendor/device IDs:**
   ```bash
   lspci -n -s 0000:XX:XX.X
   ```

### Device Configuration Validation Errors

#### Error: "Invalid device_type: Must be a DeviceType enum"

**Cause:** Device type is not properly recognized or classified.

**Solutions:**
1. **Check supported device types:**
   - GENERIC (fallback for unknown devices)
   - NETWORK_CARD
   - STORAGE_CONTROLLER
   - AUDIO_CONTROLLER
   - GRAPHICS_CARD

2. **Force device type:**
   ```bash
   # Use generic type for unsupported devices
   python3 pcileech.py build --device-type generic 0000:XX:XX.X
   ```

#### Error: "Invalid max_payload_size: Must be positive"

**Cause:** Device configuration contains invalid PCIe parameters.

**Solutions:**
1. **Check device capabilities:**
   ```bash
   sudo lspci -vvv -s 0000:XX:XX.X | grep -A 5 "DevCap"
   ```

2. **Valid payload sizes:** 128, 256, 512, 1024, 2048, 4096 bytes

#### Error: "Invalid tx_queue_depth: Must be between 1 and 65536"

**Cause:** Queue depth parameters are outside valid ranges.

**Solutions:**
1. **Use standard queue depths:**
   - Small devices: 64-256
   - Network cards: 256-1024
   - High-performance: 1024-4096

### MSI-X Related Errors

#### Error: "Failed to read actual MSI-X table data from hardware"

**Cause:** Cannot access MSI-X table via VFIO for hardware-accurate generation.

**Solutions:**
1. **Verify VFIO access:**
   ```bash
   # Check device is bound to vfio-pci
   readlink /sys/bus/pci/devices/0000:XX:XX.X/driver
   ```

2. **Check MSI-X capability:**
   ```bash
   sudo lspci -vvv -s 0000:XX:XX.X | grep -A 10 "MSI-X"
   ```

3. **Verify BAR accessibility:**
   ```bash
   # Check BAR containing MSI-X table is mappable
   cat /sys/bus/pci/devices/0000:XX:XX.X/resource*
   ```

#### Error: "MSI-X table extends beyond BAR boundary"

**Cause:** MSI-X table offset + size exceeds BAR size.

**Solutions:**
1. **Check BAR sizes:**
   ```bash
   for i in 0 1 2 3 4 5; do
     echo "BAR$i: $(cat /sys/bus/pci/devices/0000:XX:XX.X/resource$i)"
   done
   ```

2. **Verify MSI-X table location:**
   ```bash
   sudo lspci -vvv -s 0000:XX:XX.X | grep -A 5 "MSI-X.*Table"
   ```

### Register Extraction Errors

#### Error: "Behavior profile missing 'register_accesses' attribute"

**Cause:** Device behavior profiling failed or produced incomplete data.

**Solutions:**
1. **Re-run device profiling:**
   ```bash
   sudo python3 pcileech.py profile --device 0000:XX:XX.X --duration 30
   ```

2. **Check device is active:**
   ```bash
   # Ensure device is not in power-saving mode
   cat /sys/bus/pci/devices/0000:XX:XX.X/power_state
   ```

#### Error: "No valid registers extracted from behavior profile"

**Cause:** Device showed no register activity during profiling.

**Solutions:**
1. **Increase profiling duration:**
   ```bash
   sudo python3 pcileech.py profile --device 0000:XX:XX.X --duration 120
   ```

2. **Generate device activity:**
   ```bash
   # For network cards, generate traffic
   ping -c 10 8.8.8.8  # if device is active interface
   ```

3. **Use manual register map:**
   ```bash
   # Specify known registers manually
   python3 pcileech.py build --manual-registers registers.yaml 0000:XX:XX.X
   ```

### VFIO Hardware Access Errors

#### Error: "mmap failed with EINVAL - BAR may not be mappable"

**Cause:** BAR cannot be memory-mapped via VFIO.

**Solutions:**
1. **Check BAR type:**
   ```bash
   sudo lspci -vvv -s 0000:XX:XX.X | grep -A 20 "Region"
   ```

2. **Verify IOMMU configuration:**
   ```bash
   sudo dmesg | grep -i iommu | grep -i error
   ```

3. **Try different BAR:**
   ```bash
   # Use a different memory BAR if available
   python3 pcileech.py build --target-bar 2 0000:XX:XX.X
   ```

#### Error: "Could not find BAR for MSI-X table access"

**Cause:** MSI-X table BAR index (BIR) doesn't match available BARs.

**Solutions:**
1. **Check MSI-X table BIR:**
   ```bash
   sudo lspci -vvv -s 0000:XX:XX.X | grep "MSI-X.*Table"
   ```

2. **Verify BAR mapping:**
   ```bash
   # Check which BARs are actually present
   ls -la /sys/bus/pci/devices/0000:XX:XX.X/resource*
   ```

### Template Context Validation Errors

#### Error: "Template context validation failed with X critical errors"

**Cause:** Multiple validation failures in device configuration.

**Solutions:**
1. **Check full error details in logs**
2. **Common validation failures:**
   - Missing vendor_id/device_id (must be 4-character hex)
   - Invalid frequency parameters (1-2000 MHz range)
   - Queue depths outside valid ranges
   - Missing device type/class enums

3. **Use diagnostic mode:**
   ```bash
   python3 pcileech.py build --validate-only 0000:XX:XX.X
   ```

### Power Management Errors

#### Error: "Device configuration validation failed: frequency out of range"

**Cause:** Clock frequency parameters are outside safe operating ranges.

**Solutions:**
1. **Use standard frequencies:**
   - Base frequency: 100-250 MHz
   - Memory frequency: 200-800 MHz

2. **Check device specifications:**
   ```bash
   # Look up device datasheet for valid frequencies
   sudo lspci -vvv -s 0000:XX:XX.X | grep "LnkCap.*Speed"
   ```

### Prevention and Best Practices

1. **Always run device check first:**
   ```bash
   sudo python3 pcileech.py check --device 0000:XX:XX.X
   ```

2. **Use verbose logging:**
   ```bash
   python3 pcileech.py build --verbose 0000:XX:XX.X
   ```

3. **Validate configuration:**
   ```bash
   python3 pcileech.py build --validate-only 0000:XX:XX.X
   ```

4. **Keep devices active during generation:**
   ```bash
   echo on > /sys/bus/pci/devices/0000:XX:XX.X/power/control
   ```

## Getting Help

If you encounter issues not covered here:

1. **Check the logs:** The build process provides detailed logging with `[PREFIX]` tags
2. **Run diagnostics:** `sudo python3 pcileech.py check`
3. **Gather information:**
   - Device BDF and lspci output
   - Full error messages and logs
   - System configuration (kernel, IOMMU settings)
4. **Report issues:** Include all gathered information when reporting

## Common Log Prefixes

When debugging, look for these log prefixes:

- `[PWR]` - Power state related messages
- `[BARA]` - BAR analysis messages
- `[VFIO]` - VFIO binding and access messages
- `[BIND]` - Device binding operations
- `[PCIL]` - PCILeech generator core messages
- `[SVGEN]` - SystemVerilog generation messages
- `[TMPL]` - Template rendering messages
- `[MSIX]` - MSI-X table and capability messages
- `[REG]` - Register extraction and validation messages
- `[VALID]` - Configuration validation messages

## Prevention Tips

1. **Keep devices awake:** Disable runtime PM for devices you plan to use with PCILeech
2. **Verify compatibility:** Check that your device has at least one memory BAR
3. **Test binding:** Ensure you can bind to vfio-pci before running the generator
4. **Update firmware:** Keep device firmware and system BIOS up to date
