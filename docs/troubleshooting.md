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
- [Advanced Debugging](#advanced-debugging)
- [System State Inspection](#system-state-inspection)
- [Kernel Module Debugging](#kernel-module-debugging)
- [PCIe Configuration Debugging](#pcie-configuration-debugging)
- [Template and Generation Debugging](#template-and-generation-debugging)
- [Container and Environment Debugging](#container-and-environment-debugging)
- [Getting Help](#getting-help)

## VFIO Setup Issues

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

# Additional debugging commands
sudo python3 pcileech.py check --device 0000:03:00.0 --debug --verbose

# Export detailed system information
sudo python3 pcileech.py check --export-system-info system_info.json
```

### VFIO System Status Check

Before troubleshooting specific issues, get a complete system overview:

```bash
# Check IOMMU support and status
dmesg | grep -E "DMAR|IOMMU" | head -10
cat /proc/cmdline | grep -E "iommu|vfio"

# Verify VFIO modules and dependencies
lsmod | grep -E "vfio|iommu"
find /sys/module -name "vfio*" -type d

# Check VFIO device access permissions
ls -la /dev/vfio/
groups $USER | grep -E "vfio|kvm"

# System IOMMU capabilities
find /sys/kernel/iommu_groups/ -maxdepth 1 -mindepth 1 -type d | wc -l
echo "IOMMU groups found: $(find /sys/kernel/iommu_groups/ -maxdepth 1 -mindepth 1 -type d | wc -l)"
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

# Development installation debugging
pip install -e .[dev,test,tui] --verbose

# Check for conflicting packages
pip check
pip list --outdated

# Virtual environment debugging
python3 -m venv --help
python3 -m venv debug_env
source debug_env/bin/activate
pip install --verbose pcileechfwgenerator

# System package dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install -y python3-dev build-essential pkg-config
sudo apt install -y linux-headers-$(uname -r)

# System package dependencies (RHEL/CentOS/Fedora)
sudo dnf install -y python3-devel gcc make pkg-config
sudo dnf install -y kernel-headers kernel-devel

# Check Python and pip versions
python3 --version
pip --version
python3 -m pip --version

# Diagnostic installation test
python3 -c "
try:
    import pcileech
    print(f'PCILeech import successful: {pcileech.__version__}')
except Exception as e:
    print(f'PCILeech import failed: {e}')
"
```

### Permission and Access Debugging

```bash
# Check current user permissions
id
groups

# VFIO group membership
getent group vfio
getent group kvm

# Sudo configuration check
sudo -l | grep -E "(python|pcileech)"

# File system permissions
ls -la /usr/local/bin/python3*
ls -la $(which python3)
ls -la ~/.local/bin/

# SELinux context (if applicable)
ls -Z /usr/bin/python3 2>/dev/null || echo "SELinux not active"
```

## BAR Detection Issues

**Problem**: BARs not detected or incorrectly sized

**Solutions**:
1. Ensure device is properly bound to VFIO
2. Check that the device is not in use by another driver
3. Verify IOMMU group isolation
4. Use manual BAR specification if auto-detection fails

```bash
# Manual BAR specification
sudo python3 pcileech.py build --bdf 0000:03:00.0 \
  --bar0-size 0x1000 --bar1-size 0x100000
```

## VFIO Binding Problems

**Problem**: Cannot bind device to VFIO driver

**Solutions**:

1. **Check if device is in use**:
```bash
lspci -k -s 0000:03:00.0
# Should show vfio-pci as driver
```

2. **Unbind from current driver**:
```bash
echo "0000:03:00.0" | sudo tee /sys/bus/pci/devices/0000:03:00.0/driver/unbind
```

3. **Bind to VFIO**:
```bash
echo "1234 5678" | sudo tee /sys/bus/pci/drivers/vfio-pci/new_id
```

## Build Failures

**Problem**: SystemVerilog generation fails

**Common causes and solutions**:

1. **Template errors**: Check log output for specific template issues
2. **Missing device data**: Ensure VFIO extraction completed successfully
3. **BAR configuration conflicts**: Verify BAR sizes and types
4. **MSI-X table issues**: Check MSI-X capability detection

```bash
# Enable verbose logging
sudo python3 pcileech.py build --bdf 0000:03:00.0 --verbose

# Debug mode with step-by-step output
sudo python3 pcileech.py build --bdf 0000:03:00.0 --debug --step-by-step

# Dry run to check configuration without actual build
sudo python3 pcileech.py build --bdf 0000:03:00.0 --dry-run

# Build with validation checks
sudo python3 pcileech.py build --bdf 0000:03:00.0 --validate-templates --validate-device

# Save intermediate files for inspection
sudo python3 pcileech.py build --bdf 0000:03:00.0 --keep-intermediate --output-dir ./debug_build

# Test specific build stages
sudo python3 pcileech.py extract --bdf 0000:03:00.0  # Extract only
sudo python3 pcileech.py template --config extracted_config.json  # Template only
sudo python3 pcileech.py validate --output generated_files/  # Validate only
```

### Build Process Debugging

```bash
# Monitor file system changes during build
inotifywait -m -r . --format '%w%f %e' &
sudo python3 pcileech.py build --bdf 0000:03:00.0

# Check disk space and permissions
df -h .
ls -la templates/
ls -la output/

# Verify template dependencies
python3 -c "from jinja2 import Environment; print('Jinja2 OK')"
python3 -c "import yaml; print('YAML OK')"

# Test configuration parsing
sudo python3 -c "
from pcileech.config import ConfigLoader
config = ConfigLoader.load_device_config('0000:03:00.0')
print('Config loaded successfully')
print(f'Device: {config.device_id}')
print(f'BARs: {len(config.bars)}')
"
```

## Device-Specific Issues

### Network Cards

- **Intel NICs**: May require special VFIO handling
- **Realtek cards**: Often work well as donors
- **Broadcom devices**: Check for firmware dependencies

### USB Controllers

- **XHCI controllers**: Complex capability structures
- **Legacy USB**: May have simpler BAR layouts
- **USB 3.0 hubs**: Good donor candidates

### Audio Cards

- **Sound Blaster**: Usually good donors
- **USB audio**: May have complex descriptors
- **Onboard audio**: Avoid - can cause system issues

## SystemVerilog Generation Errors

**Problem**: Generated SystemVerilog has syntax errors

**Solutions**:

1. **Check template integrity**:
```bash
# Verify template files are not corrupted
ls -la templates/
```

2. **Validate device data**:
```bash
# Use debug mode to inspect extracted data
sudo python3 pcileech.py build --debug --dry-run
```

3. **Manual template fixes**:
```bash
# Edit templates if necessary
vim templates/pcileech_tlps128_bar_controller.sv.j2
```

## Advanced Debugging

This section covers advanced debugging techniques for complex issues that require deeper investigation.

### Debug Mode and Verbose Logging

Enable maximum debugging output:

```bash
# Full debug mode with verbose logging
sudo python3 pcileech.py build --bdf 0000:03:00.0 --debug --verbose

# Save debug output to file
sudo python3 pcileech.py build --bdf 0000:03:00.0 --debug --verbose 2>&1 | tee debug.log

# Python debug mode for development
PYTHONPATH=. python3 -m pdb pcileech.py build --bdf 0000:03:00.0
```

### Log File Analysis

Check various log files for detailed error information:

```bash
# Main application logs
tail -f logs/error.log
tail -f generate.log
tail -f vfio_diagnostics.log

# System logs for VFIO/IOMMU issues
sudo journalctl -f | grep -i vfio
sudo journalctl -f | grep -i iommu
sudo dmesg | grep -i "vfio\|iommu\|pci"

# Check for kernel messages during device binding
sudo dmesg -T | tail -20
```

### Environment Variable Debugging

Set debugging environment variables:

```bash
# Enable Python debugging
export PYTHONDEBUG=1
export PYTHONVERBOSE=1

# Enable template debugging
export JINJA2_DEBUG=1
export TEMPLATE_DEBUG=1

# VFIO debugging
export VFIO_DEBUG=1

# Run with debugging enabled
sudo -E python3 pcileech.py build --bdf 0000:03:00.0
```

## System State Inspection

### IOMMU and PCIe System State

Comprehensive system state inspection commands:

```bash
# IOMMU groups and device topology
python3 scripts/iommu_viewer.py --lspci --json > system_state.json

# PCIe tree structure
lspci -tv

# Device capabilities and configuration
lspci -vvv -s 0000:03:00.0

# IOMMU driver information
find /sys/kernel/iommu_groups/ -type l | sort -V

# Check IOMMU page sizes and capabilities
cat /sys/kernel/iommu_groups/*/type 2>/dev/null | sort | uniq
```

### Memory and Resource Inspection

```bash
# Check available memory
free -h
cat /proc/meminfo | grep -i huge

# Check for memory mapping issues
cat /proc/iomem | grep -i vfio
cat /proc/ioports | grep -i vfio

# Check for resource conflicts
lspci -vvv | grep -A5 -B5 "Memory\|I/O"
```

### Process and File Descriptor Debugging

```bash
# Check if device files are in use
lsof /dev/vfio/*

# Monitor file system access during operation
sudo strace -e trace=file python3 pcileech.py check --device 0000:03:00.0

# Check process tree and resource usage
ps aux | grep -E "(python|pcileech|vfio)"
```

## Kernel Module Debugging

### VFIO Module State

```bash
# Check loaded VFIO modules
lsmod | grep vfio

# Get detailed module information
modinfo vfio
modinfo vfio_pci
modinfo vfio_iommu_type1

# Check module parameters
cat /sys/module/vfio_pci/parameters/*

# Reload modules with debugging
sudo modprobe -r vfio_pci vfio_iommu_type1 vfio
sudo modprobe vfio enable_unsafe_noiommu_mode=1
sudo modprobe vfio_iommu_type1
sudo modprobe vfio_pci
```

### Kernel Ring Buffer Analysis

```bash
# Monitor kernel messages during operations
sudo dmesg -w &
# Run your command in another terminal

# Search for specific error patterns
dmesg | grep -E "(VFIO|IOMMU|PCI.*error|DMA.*error)"

# Check for AER (Advanced Error Reporting) messages
dmesg | grep -i aer
```

## PCIe Configuration Debugging

### Configuration Space Analysis

```bash
# Dump complete PCIe configuration space
sudo lspci -xxxx -s 0000:03:00.0

# Decode configuration space with details
sudo pcimem 0000:03:00.0 0x00 256  # First 256 bytes

# Check specific capability structures
sudo lspci -vvv -s 0000:03:00.0 | grep -A10 "Capabilities:"

# Monitor configuration space changes
while true; do
    sudo lspci -xxxx -s 0000:03:00.0 | md5sum
    sleep 1
done
```

### BAR and Memory Debugging

```bash
# Inspect BAR configurations
sudo lspci -vvv -s 0000:03:00.0 | grep -A20 "Memory at"
sudo lspci -vvv -s 0000:03:00.0 | grep -A20 "I/O ports at"

# Check BAR sizing capability
sudo setpci -s 0000:03:00.0 BASE_ADDRESS_0.L
sudo setpci -s 0000:03:00.0 BASE_ADDRESS_1.L

# VFIO device file permissions and access
ls -la /dev/vfio/*
sudo file /dev/vfio/vfio
sudo file /dev/vfio/[0-9]*
```

### MSI/MSI-X Debugging

```bash
# Check MSI/MSI-X capabilities
sudo lspci -vvv -s 0000:03:00.0 | grep -A5 "MSI:"
sudo lspci -vvv -s 0000:03:00.0 | grep -A10 "MSI-X:"

# Interrupt information
cat /proc/interrupts | grep -i vfio
cat /proc/irq/*/vfio_*

# Check interrupt affinity
for irq in /proc/irq/*/vfio_*; do
    echo "$irq: $(cat $irq/smp_affinity)"
done
```

## Template and Generation Debugging

### Template Engine Debugging

```bash
# Test template rendering in isolation
python3 -c "
from jinja2 import Environment, FileSystemLoader
env = Environment(loader=FileSystemLoader('templates/'))
template = env.get_template('pcileech_tlps128_bar_controller.sv.j2')
print(template.render(debug=True))
"

# Validate template syntax
python3 -c "
from jinja2 import Environment, FileSystemLoader, meta
env = Environment(loader=FileSystemLoader('templates/'))
source = env.loader.get_source(env, 'pcileech_tlps128_bar_controller.sv.j2')
parsed = env.parse(source)
print('Template variables:', meta.find_undeclared_variables(parsed))
"
```

### SystemVerilog Output Debugging

```bash
# Generate with intermediate files preserved
sudo python3 pcileech.py build --bdf 0000:03:00.0 --keep-temp

# Validate generated SystemVerilog syntax
# (requires iverilog or similar)
iverilog -t null output/*.sv

# Check for common SystemVerilog issues
grep -n "^\s*wire.*wire\|reg.*reg" output/*.sv
grep -n "always.*always" output/*.sv
```

### Data Extraction Debugging

```bash
# Inspect extracted device data
sudo python3 -c "
import json
from pcileech.core.vfio import VFIODevice
device = VFIODevice('0000:03:00.0')
print(json.dumps(device.get_device_info(), indent=2))
"

# Test individual components
sudo python3 -c "
from pcileech.core.device import PCIDevice
device = PCIDevice('0000:03:00.0')
print('BARs:', device.bars)
print('Capabilities:', device.capabilities)
"
```

## Container and Environment Debugging

### Container Runtime Debugging

```bash
# Check container runtime
podman --version
podman info

# Debug container permissions
podman run --privileged --rm -it \
  -v /dev:/dev \
  -v /sys:/sys \
  localhost/pcileech:latest \
  ls -la /dev/vfio/

# Container logs and debugging
podman logs pcileech-container
podman exec -it pcileech-container /bin/bash
```

### Python Environment Debugging

```bash
# Check Python path and modules
python3 -c "import sys; print('\n'.join(sys.path))"
python3 -c "import pcileech; print(pcileech.__file__)"

# Check installed packages and versions
pip list | grep -E "(jinja2|click|pyyaml|textual)"
python3 -c "import pcileech; print(pcileech.__version__)"

# Virtual environment debugging
which python3
echo $VIRTUAL_ENV
pip debug --verbose
```

### File System and Permissions

```bash
# Check file system permissions
ls -la /dev/vfio/
ls -la /sys/bus/pci/devices/0000:03:00.0/
ls -la /sys/kernel/iommu_groups/

# Check mount points and file systems
mount | grep -E "(sysfs|proc|dev)"
df -h /tmp /var/tmp

# SELinux/AppArmor debugging (if applicable)
getenforce 2>/dev/null || echo "SELinux not active"
aa-status 2>/dev/null || echo "AppArmor not active"
```

## Getting Help

If you're still experiencing issues:

1. **Check the documentation**: Browse all available guides
2. **Use diagnostic tools**: Run built-in checks and diagnostics
3. **Enable debug logging**: Use `--debug` and `--verbose` flags
4. **Search existing issues**: Check GitHub issues for similar problems
5. **Create a detailed issue**: Include logs, system info, and device details

### Creating Effective Bug Reports

Include the following information:

- Operating system and kernel version
- Device PCI ID and BDF
- Complete error logs with `--debug` enabled
- Output of diagnostic checks
- Steps to reproduce the issue

**Comprehensive bug report collection script:**

```bash
#!/bin/bash
# Bug report collection script
echo "=== PCILeech Bug Report $(date) ===" > bug_report.txt

echo -e "\n=== System Information ===" >> bug_report.txt
uname -a >> bug_report.txt
lsb_release -a 2>/dev/null >> bug_report.txt || cat /etc/os-release >> bug_report.txt
python3 --version >> bug_report.txt
pip list | grep -E "(pcileech|jinja|click|yaml)" >> bug_report.txt

echo -e "\n=== Hardware Information ===" >> bug_report.txt
lscpu | head -20 >> bug_report.txt
lspci -nn >> bug_report.txt
free -h >> bug_report.txt

echo -e "\n=== VFIO/IOMMU Status ===" >> bug_report.txt
dmesg | grep -E "DMAR|IOMMU|VFIO" | tail -20 >> bug_report.txt
lsmod | grep -E "vfio|iommu" >> bug_report.txt
ls -la /dev/vfio/ >> bug_report.txt

echo -e "\n=== PCILeech Diagnostics ===" >> bug_report.txt
sudo python3 pcileech.py check --debug 2>&1 >> bug_report.txt

echo -e "\n=== IOMMU Groups ===" >> bug_report.txt
python3 scripts/iommu_viewer.py --json >> bug_report.txt 2>&1

echo "Bug report saved to bug_report.txt"
```

**Device-specific debugging information:**

```bash
# For a specific device issue, collect:
DEVICE_BDF="0000:03:00.0"  # Replace with your device

echo "=== Device-Specific Information ===" >> device_debug.txt
lspci -nnvvv -s $DEVICE_BDF >> device_debug.txt
sudo lspci -xxxx -s $DEVICE_BDF >> device_debug.txt
ls -la /sys/bus/pci/devices/$DEVICE_BDF/ >> device_debug.txt
cat /sys/bus/pci/devices/$DEVICE_BDF/uevent >> device_debug.txt

# Include IOMMU group information
find /sys/kernel/iommu_groups -name "$DEVICE_BDF" -type l \
  | xargs -I {} dirname {} \
  | xargs -I {} find {} -type l \
  | xargs ls -la >> device_debug.txt

# VFIO-specific device checks
sudo python3 pcileech.py check --device $DEVICE_BDF --debug \
  >> device_debug.txt 2>&1
```

**Performance and timing debugging:**

```bash
# Time operations to identify bottlenecks
echo "=== Performance Analysis ===" >> perf_debug.txt
time sudo python3 pcileech.py check --device 0000:03:00.0 \
  >> perf_debug.txt 2>&1

# System resource monitoring during operation
top -b -n 1 >> perf_debug.txt
iostat -x 1 3 >> perf_debug.txt 2>/dev/null || echo "iostat not available"
vmstat 1 3 >> perf_debug.txt
```

If the problem is related to VFIO, device binding, or IOMMU group issues please also include the output of our bundled IOMMU viewer. This provides a compact, deterministic snapshot of the system IOMMU layout and driver bindings which is extremely useful for debugging.

How to run the bundled IOMMU viewer

```bash
# Basic (human readable)
python3 scripts/iommu_viewer.py

# Show only a specific IOMMU group
python3 scripts/iommu_viewer.py -g 25

# JSON output suitable for pasting into an issue
python3 scripts/iommu_viewer.py --json > iommu_snapshot.json

# Enrich output with lspci (requires lspci available and may be slow)
sudo python3 scripts/iommu_viewer.py --lspci
```

What to paste in an issue

- `iommu_snapshot.json` (if you used `--json`) or the plain output
- `lspci -nnk -s <DEVICE_BDF>` for the affected device(s)
- The output of `sudo python3 pcileech.py check --device <BDF> --debug` if possible

This information helps maintainers reproduce IOMMU and VFIO binding problems quickly.

### Community Support

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community help

Remember: This tool requires real hardware and proper VFIO setup. Most issues are related to VFIO configuration rather than the tool itself.

## Quick Reference: Common Debugging Commands

### Essential Diagnostics

```bash
# Quick system check
sudo python3 pcileech.py check --debug

# Device-specific check
sudo python3 pcileech.py check --device 0000:03:00.0 --debug

# Full system state
python3 scripts/iommu_viewer.py --json > system_state.json

# VFIO status
lsmod | grep vfio && ls -la /dev/vfio/
```

### IOMMU and Hardware

```bash
# IOMMU verification
dmesg | grep -E "DMAR|IOMMU" | head -5
find /sys/kernel/iommu_groups/ -maxdepth 1 -mindepth 1 | wc -l

# PCIe device details
lspci -nnvvv -s 0000:03:00.0
sudo lspci -xxxx -s 0000:03:00.0

# Hardware capabilities
cat /proc/cpuinfo | grep -E "flags.*vt-d|flags.*amd_iommu"
```

### Build and Generation

```bash
# Debug build process
sudo python3 pcileech.py build --bdf 0000:03:00.0 --debug --dry-run

# Template validation
python3 -c "from jinja2 import Environment, FileSystemLoader; env = Environment(loader=FileSystemLoader('templates/')); print('Templates OK')"

# Output validation
ls -la output/ && echo "Build completed"
```

### System Monitoring

```bash
# Real-time monitoring during operations
sudo dmesg -w &  # Kernel messages
sudo journalctl -f | grep -i vfio &  # System logs
htop  # Process monitoring

# Stop monitoring
pkill -f "dmesg -w"
pkill -f "journalctl -f"
```

### Emergency Recovery

```bash
# Reset VFIO bindings
sudo modprobe -r vfio_pci vfio_iommu_type1 vfio
sudo modprobe vfio vfio_iommu_type1 vfio_pci

# Restore device to original driver
echo "0000:03:00.0" | sudo tee /sys/bus/pci/drivers/vfio-pci/unbind
echo "0000:03:00.0" | sudo tee /sys/bus/pci/drivers_probe

# Check system stability
dmesg | tail -20
lspci -k -s 0000:03:00.0
```
