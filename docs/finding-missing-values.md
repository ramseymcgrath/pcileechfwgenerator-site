## Finding common missing values (Linux only)

This short guide shows reliable, Linux-only commands and examples for locating the common template values the generator may ask for (PCI vendor/device IDs, revision/class codes, BARs and whether the device supports MSI / MSI-X). It's written for first-time users who have shell access on the machine where the PCI device is present.

### Quick checklist

- Identify the device BDF (bus:device.function), e.g. `0000:03:00.0`
- Read vendor/device IDs and revision/class codes
- Inspect BARs (addresses and sizes)
- Detect MSI / MSI-X capability

All commands below assume you have sudo where needed and that you're on a Linux host.

## Useful tools

- `lspci` (from pciutils) — human-friendly PCI info
- `setpci` — read/write raw PCI config registers
- `hexdump` / `xxd` — inspect raw `/sys` config bytes
- `/sys/bus/pci/devices/<BDF>/config` — binary PCI configuration space
- `/sys/bus/pci/devices/<BDF>/resource` — BAR start/end/flags

If any of these tools are missing: install `pciutils` (provides `lspci`/`setpci`) and use `hexdump` (usually in `bsdmainutils` or provided by the system).

## Find the device BDF

List all PCI devices and search for a recognizable name or driver:

```
lspci
lspci | grep -i <partial-device-name-or-vendor>
```

Example:

```
$ lspci | grep -i xilinx
03:00.0 Ethernet controller: Xilinx Corporation Device 1234:abcd (rev 01)
```

The left-most `03:00.0` is the BDF (short form). The full ID is usually `0000:03:00.0`.

## Vendor and Device IDs (VID:PID)

Show numeric vendor:device IDs with `lspci -nn`:

```
lspci -nn -s 03:00.0
```

Example output:

```
03:00.0 Ethernet controller [0200]: Xilinx Corporation Device [1234:abcd] (rev 01)
```

- Vendor ID (VID) = `1234`
- Device ID (PID) = `abcd`

You can also use `lspci -n -s <BDF>` to show numeric class codes.

## Revision ID and Class Code

`lspci -v -s <BDF>` prints a readable summary including `rev` and class information. For raw bytes, read the first 64 bytes of the PCI config space:

```
sudo hexdump -C -n 64 /sys/bus/pci/devices/0000:03:00.0/config
```

Interpretation of key offsets (standard PCI header):
- 0x00-0x01: Vendor ID (2 bytes)
- 0x02-0x03: Device ID (2 bytes)
- 0x08: Revision ID (1 byte)
- 0x09: Prog IF (1 byte)
- 0x0A: Subclass (1 byte)
- 0x0B: Class code (1 byte)

Example (hexdump output snippet):

```
00000000  d4 12 ab cd  00 00 00 00  01 00 02 03  00 00 00 00  |................|
         ^^^^^^^^^^^^^
         vendor device  ...  rev prog-if subclass class
```

From the example above:
- `revision_id` = `0x01` (decimal 1)
- `class_code` = bytes `(class, subclass, prog-if)` = `0x03 0x02 0x00` (ordering depends on how you format; `lspci -n` is the easiest human-readable form)

## Reading BARs (Base Address Registers)

BARs start at offset `0x10` in the PCI config header (BAR0 at 0x10, BAR1 at 0x14, ...). Use `lspci -v -s <BDF>` to get decoded addresses and sizes, or read `/sys` resources for precise start/size:

```
sudo cat /sys/bus/pci/devices/0000:03:00.0/resource
```

Output format: each line is `start end flags` in hex. Size = `end - start + 1`.

Example:

```
0x00000000f7c00000 0x00000000f7c0ffff 0x00000000
0x0000000000000000 0x0000000000000fff 0x00000000
...
```

The `lspci -v` output also lists the same regions in a human-friendly form, e.g. `Region 0: Memory at f7c00000 (64-bit, non-prefetchable) [size=0x10000]`.

If you need to read a BAR register directly from config space (raw):

```
sudo setpci -s 03:00.0 0x10.L   # read BAR0 as 32-bit value
sudo setpci -s 03:00.0 0x14.L   # read BAR1
```

Careful: writing to BARs can disrupt the system; only read unless you know what you're doing.

## Detecting MSI / MSI-X support

The easiest method is `lspci -vv -s <BDF>` and look for `Capabilities:` sections named `MSI` or `MSI-X`.

```
lspci -vv -s 03:00.0 | sed -n '/Capabilities/,/Kernel driver/p'
```

If `MSI` or `MSI-X` appear, the device exposes the corresponding capability.

For a raw check using config space, inspect the PCI capability list. The pointer to the first capability is at offset `0x34` (header type 0). Each capability entry is two bytes: `cap_id` (1 byte) and `next_ptr` (1 byte). Known capability IDs:

- `0x05` = MSI
- `0x11` = MSI-X

Example: dump config and look for `05` or `11` at capability offsets:

```
sudo hexdump -C /sys/bus/pci/devices/0000:03:00.0/config | sed -n '5,12p'
# then inspect the byte at offset 0x34 and follow the chain
```

If you need to confirm active MSI vectors, check `/proc/interrupts` for entries using the device's driver or BDF tag.

## Quick decision rules for common fallback fields

- `device.vendor_id` / `device.device_id`: take from `lspci -nn` output
- `device.revision_id`: byte at offset `0x08` (or `lspci -v` `rev`) — CRITICAL: obtain from hardware; do NOT use a fallback
- `device.class_code`: use `lspci -n` or `lspci -v` for the full class/subclass/prog-if
- `board.fpga_family`, `board.fpga_part`, `board.name`: usually non-PCI; get from board documentation, README, or hardware vendor tools
- `sys_clk_freq_mhz`: common default is `100` MHz — check board docs or FPGA constraints
- `supports_msi` / `supports_msix`: set to `true` if `lspci -vv` shows the capability and the kernel/driver exposes MSI or MSI-X; otherwise `false`

## Safety notes

- Never add device/vendor IDs, PCI BAR addresses that come from hardware, or other hardware-only secrets into shared fallback files. The generator already treats those as "sensitive" and will refuse to export values for them.
- Use the `fallbacks_template` exported by the CLI as a starting point (see `site/docs/fallbacks.md`).

## Examples (copyable)

Find numeric IDs for BDF `03:00.0`:

```
lspci -nn -s 03:00.0

# Raw config bytes (first 64 bytes)
sudo hexdump -C -n 64 /sys/bus/pci/devices/0000:03:00.0/config

# Check for MSI/MSI-X capability
lspci -vv -s 03:00.0 | grep -i msi -A2

# Show BARs and decoded regions
lspci -v -s 03:00.0
cat /sys/bus/pci/devices/0000:03:00.0/resource
```

## See also
- `fallbacks.md` — how fallbacks work and what to put in `configs/fallbacks.yaml`
- `device-cloning.md` — device cloning workflow and where these values matter

If you'd like, I can add a short example `output/missing_context.yaml` file to `site/docs` so first-time users can see a filled-in example they can edit — should I add that next?
