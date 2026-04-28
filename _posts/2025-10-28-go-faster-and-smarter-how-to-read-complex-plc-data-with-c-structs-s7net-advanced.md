---
layout: post
lang: en
title: "Go Faster and Smarter: How to Read Complex PLC Data with C# Structs (S7.NET Advanced)"
description: "A practical guide to high-performance Siemens S7-1500 data access with S7.NET, C# structs, memory alignment, and efficient batch reads and writes."
date: 2025-10-28 12:10:00 +0300
permalink: /blog/go-faster-and-smarter-how-to-read-complex-plc-data-with-c-structs-s7net-advanced/
en_url: /blog/go-faster-and-smarter-how-to-read-complex-plc-data-with-c-structs-s7net-advanced/
tr_url: /tr/blog/csharp-struct-ile-kompleks-plc-verisi-okuma-s7net-advanced/
translation_key: "plc-structured-read"
keywords: ["C#", ".NET", "S7.NET", "PLC", "Siemens S7-1500", "TIA Portal", "Performance", "Industrial integration"]
tags: ["csharp", "dotnet", "plc", "s7net", "performance"]
original_url: "https://dev.to/ferhatacar/go-faster-and-smarter-how-to-read-complex-plc-data-with-c-structs-s7net-advanced-3o09"
seo:
  type: BlogPosting
---

## Introduction: Why Your First Method Was Too Slow

Hello again, factory developers! If you read my first article [Connecting Factory Machines to Your Code: A Simple Guide to S7-1500 and C# with S7.NET](/blog/connecting-factory-machines-to-your-code-a-simple-guide-to-s7-1500-and-c-with-s7net/), you successfully connected your C# application to your Siemens S7-1500 PLC. That was a huge first step!

But now, you are building a real application, and you need to monitor 100 or 200 different tags (variables). If you read each tag one by one:

- You send 100 network requests.
- The PLC responds 100 times.

This takes a lot of time and makes your application slow and inefficient. The solution is to ask the PLC for a big chunk of data in one single request. We will organize our data in the PLC and map that organization perfectly into a C# class, letting us read all 100 tags in less than a second!

This is the power of Structured Reading. Let's make your code fast and smart.

## 1. Preparing the Data on the PLC Side (TIA Portal)

To read data in one single "chunk," the data in the PLC must be placed in sequential memory addresses.

### 1.1. Create a Non-Optimized Data Block (DB)

We need an old-school data structure called Standard Access (non-optimized) because S7.NET reads memory addresses sequentially, just like in the S7-300 era.

### Create a New DB: Let's use DB2.

Add Variables: Add the variables you need for a single machine or process.

| PLC Tag Name | Data Type (TIA Portal) | Size in Bytes | Start Address |

| PLC tag | Data type | Size | Address |
| --- | --- | --- | --- |
| `Motor_Running` | `BOOL` | 1 byte | `DBX0.0` |
| `Speed_SP` | `INT` | 2 bytes | `DBW2` |
| `Temp_Measured` | `REAL` | 4 bytes | `DBD4` |
| `Status_Word` | `WORD` | 2 bytes | `DBW8` |
| `Cycle_Counter` | `DINT` | 4 bytes | `DBD10` |

**The MUST-DO Setting:** Right-click DB2 properties, go to Attributes, and ensure "Optimized block access" is **UNCHECKED**. Then, download the DB to the PLC.

**Why Non-Optimized?** Optimized access lets the PLC rearrange data for its own speed. Non-optimized access forces the PLC to keep the variables in the exact order you defined (DBX0.0, DBW2, DBD4, etc.). This sequential order is what S7.NET needs to mirror in C#.

## 2. The Core Challenge: Memory Alignment (Padding)

The biggest challenge when mapping PLC memory to a C# class is **Memory Alignment (or Padding)**.

PLCs (and C#) are efficient when certain data types (like INT, REAL) start at even-numbered memory addresses (2, 4, 8, etc.). If a small data type (like BOOL, which is 1 byte) finishes at an odd address, we must skip the next byte to keep the alignment right. This skipped memory is called **Padding**.

Let's look at the C# class that perfectly maps our DB2.

### 2.1. Defining the C# Mirror Class

We use two important attributes from `System.Runtime.InteropServices` and `S7.Net.Types`:

- `[StructLayout(LayoutKind.Sequential, Pack = 1)]`: This tells C# to arrange the class fields in the order they are declared, using the tightest packing (Pack = 1).
- `[PlcPadding(X)]`: This tells S7.NET to skip 'X' number of bytes to match the PLC's memory gap.

```csharp
using S7.Net;
using S7.Net.Types;
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]
public class MachineData
{
    // DBX0.0: BOOL (1 byte)
    public bool Motor_Running { get; set; }

    // --- PADDING NEEDED HERE ---
    // The BOOL ends at address 0. The next INT (Speed_SP) needs to start at address 2 (DBW2).
    // We must skip address 1 (1 byte).
    [PlcPadding(1)]
    public byte Filler_1 { get; set; } // This is our 1-byte gap.

    // DBW2: INT (2 bytes)
    public Int16 Speed_SP { get; set; } // Speed Setpoint

    // DBD4: REAL (4 bytes)
    public float Temp_Measured { get; set; }

    // DBW8: WORD (2 bytes)
    public UInt16 Status_Word { get; set; } // Use UInt16 for unsigned WORD

    // DBD10: DINT (4 bytes)
    public Int32 Cycle_Counter { get; set; }

    public override string ToString()
    {
        return $"--- Real-Time Machine Report ---\n" +
               $"Status: {(Motor_Running ? "RUNNING" : "STOPPED")}\n" +
               $"Target Speed: {Speed_SP} RPM\n" +
               $"Current Temp: {Temp_Measured:F2} \u00b0C\n" +
               $"Error Code: 0x{Status_Word:X4}\n" +
               $"Total Cycles: {Cycle_Counter}\n" +
               $"----------------------------------";
    }
}
```

## 3. Step 3: High-Speed Reading with One Command

With our perfectly aligned `MachineData` class, we can now read all this data using one simple command: `plc.ReadStruct()`.

### 3.1. The PLC Connection and Read Logic

This method assumes you have already connected the `Plc` object successfully, as shown in the first article.

```csharp
using S7.Net;
using System;
// The MachineData class must be defined in your project.

public class PlcDataManager
{
    public static void ReadDataChunk(Plc plc)
    {
        try
        {
            Console.WriteLine("Starting FAST Read of Machine Data...");

            // Reads ALL variables in DB2 starting at Byte 0.
            // Arguments: DB Number (2), Start Byte Address (0)
            MachineData data = plc.ReadStruct<MachineData>(2, 0);

            if (data != null)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("\nSUCCESS: All data read in ONE network request!");
                Console.ResetColor();

                Console.WriteLine(data.ToString());

                if ((data.Status_Word & 0x0001) != 0)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("ALARM: Emergency Stop bit is set!");
                    Console.ResetColor();
                }
            }
            else
            {
                Console.WriteLine("\nERROR: Data read failed. Check your DB address and alignment.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\nFATAL ERROR during reading: {ex.Message}");
            Console.WriteLine("HINT: Verify your [PlcPadding] and TIA Portal's 'Optimized Access' setting.");
        }
    }
}
```

## 4. Step 4: High-Speed Writing (Sending Commands)

The best part is that this same structured approach works for writing data! If you want to send a new speed setpoint, a new recipe ID, and a start command, you can write all of them in one go using `plc.WriteStruct()`.

### 4.1. The Batch Write Code

```csharp
public static void WriteDataChunk(Plc plc)
{
    try
    {
        var commandData = new MachineData
        {
            Motor_Running = true,
            Speed_SP = 850,
            Status_Word = 0
        };

        plc.WriteStruct(commandData, 2, 0);

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("SUCCESS: All commands sent in ONE efficient network request!");
        Console.ResetColor();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Write error: {ex.Message}");
    }
}
```

## Conclusion: You are a Performance Expert Now!

You have mastered the secret to high-performance PLC-IT integration!

By using the **Structured Read/Write** technique with the S7.NET library, you are no longer limited by slow, single-tag communication. You are now building industrial applications that are **fast, reliable, and scalable** for any real-world factory environment.

Keep coding, keep integrating, and see you in the next article!
