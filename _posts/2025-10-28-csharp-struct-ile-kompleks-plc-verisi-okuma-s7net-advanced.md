---
layout: post
lang: tr
title: "C# Struct ile Kompleks PLC Verisini Daha Hızlı ve Akıllı Okuma (S7.NET Advanced)"
description: "Siemens S7-1500 sistemlerinde S7.NET, C# struct, bellek hizalama ve toplu okuma-yazma yaklaşımıyla yüksek performanslı veri erişimi rehberi."
date: 2025-10-28 12:10:00 +0300
permalink: /tr/blog/csharp-struct-ile-kompleks-plc-verisi-okuma-s7net-advanced/
en_url: /blog/go-faster-and-smarter-how-to-read-complex-plc-data-with-c-structs-s7net-advanced/
tr_url: /tr/blog/csharp-struct-ile-kompleks-plc-verisi-okuma-s7net-advanced/
translation_key: "plc-structured-read"
keywords: ["C#", ".NET", "S7.NET", "PLC", "Siemens S7-1500", "TIA Portal", "Performans", "Endüstriyel entegrasyon"]
tags: ["csharp", "dotnet", "plc", "s7net", "performance"]
original_url: "https://dev.to/ferhatacar/go-faster-and-smarter-how-to-read-complex-plc-data-with-c-structs-s7net-advanced-3o09"
seo:
  type: BlogPosting
---

## Giriş

Demo seviyesini geçip onlarca hatta yüzlerce PLC değişkeni okumaya başladığınızda, tek tek tag okuma yaklaşımı ciddi bir darboğaza dönüşür. Her alan için ayrı istek göndermek daha fazla gecikme, daha fazla ağ trafiği ve uygulama tarafında daha fazla yük anlamına gelir.

Daha hızlı yaklaşım şudur: PLC belleğinde ilişkili verileri yan yana yerleştirin, sonra bu yapıyı C# tarafında birebir karşılayan bir sınıf tanımlayın. `S7.NET` ile bu sayede tek istekle bütün bloğu okuyabilir ve sonucu güçlü tiplenmiş bir nesneye dönüştürebilirsiniz.

## 1. Yapısal okuma neden daha hızlıdır?

Değerleri tek tek okursanız:

- Her tag için ayrı bir istek gönderirsiniz.
- PLC her isteğe ayrı cevap verir.
- Ağ gecikmesi birikerek büyür.

Tek bir yapısal blok okursanız:

- Bitişik bir bellek alanını tek seferde istersiniz.
- PLC bir kez cevap verir.
- Uygulama tarafında dağınık okumalar yerine tek bir tipli nesneyle çalışırsınız.

Bu fark, “çalışıyor” ile “ölçeklenebilir şekilde çalışıyor” arasındaki farktır.

## 2. PLC verisini ardışık erişime uygun hazırlayın

Yapısal okuma yalnızca PLC bellek düzeni öngörülebilir olduğunda iyi çalışır. Siemens projelerinde bunun anlamı çoğu zaman non-optimized bir data block kullanmak ve ilişkili alanları sabit sırayla yerleştirmektir.

### Örnek DB düzeni

| PLC tag | Veri tipi | Boyut | Adres |
| --- | --- | --- | --- |
| `Motor_Running` | `BOOL` | 1 byte | `DBX0.0` |
| `Speed_SP` | `INT` | 2 byte | `DBW2` |
| `Temp_Measured` | `REAL` | 4 byte | `DBD4` |
| `Status_Word` | `WORD` | 2 byte | `DBW8` |
| `Cycle_Counter` | `DINT` | 4 byte | `DBD10` |

### TIA Portal kontrol listesi

1. Birlikte okunacak değerler için özel bir data block oluşturun.
2. Değişkenleri C# tarafında eşleyeceğiniz sırayla dizin.
3. Adreslerin sabit kalması için **Optimized block access** seçeneğini kapatın.
4. Güncellenen DB'yi PLC'ye yükleyin.

Adresler sabit değilse, C# sınıfı doğru görünse bile bellek eşleşmesi yanlış kalır.

## 3. Hizalama ve padding konusunu anlayın

Asıl kritik nokta okuma çağrısının kendisi değil, bellek hizalamasıdır.

Bazı PLC veri tiplerinin belirli byte sınırlarında başlaması gerekir. Örneğin bir `BOOL` alanından hemen sonra `INT` gelirken, `INT`'in bir sonraki çift adresten başlaması gerekebilir. Bu durumda PLC belleğini doğru temsil etmek için C# tarafında boşluk bırakmanız gerekir.

```csharp
using S7.Net;
using S7.Net.Types;
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]
public class MachineData
{
    public bool Motor_Running { get; set; }   // DBX0.0

    [PlcPadding(1)]
    public byte Filler_1 { get; set; }        // Adres 1 atlanır

    public short Speed_SP { get; set; }       // DBW2
    public float Temp_Measured { get; set; }  // DBD4
    public ushort Status_Word { get; set; }   // DBW8
    public int Cycle_Counter { get; set; }    // DBD10
}
```

### Pratik kural

- PLC alan sırasını birebir koruyun.
- Veri tiplerini birebir eşleyin.
- Bir sonraki alan yanlış byte konumuna düşüyorsa padding ekleyin.

Sınıf yerleşimi ile PLC yerleşimi örtüştüğünde `ReadStruct<T>` son derece verimli çalışır.

## 4. Tüm bloğu tek istekle okuyun

Eşleme doğru kurulduktan sonra okuma mantığı oldukça sadeleşir.

```csharp
using S7.Net;
using System;

public class PlcDataManager
{
    public static void ReadDataChunk(Plc plc)
    {
        try
        {
            Console.WriteLine("Hızlı okuma başlatılıyor...");

            MachineData data = plc.ReadStruct<MachineData>(2, 0);

            if (data == null)
            {
                Console.WriteLine("Okuma başarısız. DB numarası, offset ve padding değerlerini kontrol edin.");
                return;
            }

            Console.WriteLine($"Çalışıyor: {data.Motor_Running}");
            Console.WriteLine($"Hedef hız: {data.Speed_SP}");
            Console.WriteLine($"Ölçülen sıcaklık: {data.Temp_Measured:F2}");
            Console.WriteLine($"Status word: 0x{data.Status_Word:X4}");
            Console.WriteLine($"Cycle counter: {data.Cycle_Counter}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Okuma hatası: {ex.Message}");
        }
    }
}
```

Bu yaklaşım size şunları kazandırır:

- daha az istek,
- daha düşük gecikme,
- daha temiz uygulama kodu,
- OT ve IT katmanları arasında tekrar kullanılabilir veri sözleşmesi.

## 5. Birden fazla değeri tek işlemle yazın

Aynı yaklaşım yazma tarafında da geçerlidir. Struct PLC veri bloğunu doğru temsil ediyorsa, birden fazla değeri tek seferde PLC'ye gönderebilirsiniz.

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
        Console.WriteLine("Komutlar başarıyla gönderildi.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Yazma hatası: {ex.Message}");
    }
}
```

Bu özellikle şu durumlarda çok değerlidir:

- setpoint ve komut bitini birlikte gönderirken,
- recipe verisi yazarken,
- gruplanmış makine parametrelerini güncellerken,
- yüksek frekanslı entegrasyonlarda yazma yükünü azaltırken.

## 6. Sık karşılaşılan hata noktaları

Sonuçlar tutarsız görünüyorsa önce şunları kontrol edin:

- DB hâlâ optimized durumda olabilir.
- DB numarası veya başlangıç byte adresi yanlış olabilir.
- C# alan tiplerinden biri PLC tipiyle uyuşmuyor olabilir.
- Gerekli padding eksik olabilir.
- PLC tarafındaki alan sırası değişmiştir ama C# sınıfı güncellenmemiştir.

S7.NET struct kullanımındaki “garip” sorunların büyük bölümü kütüphaneden değil, bellek düzeni uyumsuzluğundan kaynaklanır.

## Sonuç

Yapısal okuma, PLC ile .NET entegrasyonunda uygulayabileceğiniz en pratik performans iyileştirmelerinden biridir.

Her PLC tag'ini bağımsız istek gibi ele almak yerine ilişkili verileri tek bir bellek bloğu olarak modelleyin, C# tarafında dikkatli şekilde yansıtın ve veriyi daha büyük, öngörülebilir parçalar hâlinde taşıyın. Sonuç olarak daha hızlı haberleşme, daha temiz kod ve gerçek endüstriyel uygulamalar için çok daha sağlam bir temel elde edersiniz.
