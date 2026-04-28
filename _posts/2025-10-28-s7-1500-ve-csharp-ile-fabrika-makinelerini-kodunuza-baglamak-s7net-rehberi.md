---
layout: post
lang: tr
title: "S7-1500 ve C# ile Fabrika Makinelerini Kodunuza Bağlamak: S7.NET Rehberi"
description: "Siemens S7-1500 PLC verisini C# içinden S7.NET ile okumaya başlamak için TIA Portal ayarları, DB hazırlığı ve bağlantı temellerini anlatan adım adım rehber."
date: 2025-10-28 11:55:00 +0300
permalink: /tr/blog/s7-1500-ve-csharp-ile-fabrika-makinelerini-kodunuza-baglamak-s7net-rehberi/
en_url: /blog/connecting-factory-machines-to-your-code-a-simple-guide-to-s7-1500-and-c-with-s7net/
tr_url: /tr/blog/s7-1500-ve-csharp-ile-fabrika-makinelerini-kodunuza-baglamak-s7net-rehberi/
translation_key: "plc-connection-basics"
keywords: ["C#", ".NET", "S7.NET", "PLC", "S7-1500", "TIA Portal", "Endüstriyel haberleşme"]
tags: ["csharp", "dotnet", "plc", "s7net"]
original_url: "https://dev.to/ferhatacar/connecting-factory-machines-to-your-code-a-simple-guide-to-s7-1500-and-c-with-s7net-1hlm"
seo:
  type: BlogPosting
---

## Giriş

Fabrika yazılımları gerçek makine verisi okuyabildiğinde çok daha değerli hâle gelir. Siemens S7-1500 PLC ile çalışıyor ve bir C# uygulamasından veri almak istiyorsanız, `S7.NET` bu iş için oldukça pratik bir başlangıç sunar.

Bu rehberin odağı ilk çalışan köprüdür: PLC'yi hazırlamak, erişim ayarlarını doğru yapmak ve C# projesinden basit bir değeri başarıyla okumak.

## 1. Başlamadan önce gerekenler

PLC tarafında şunları hazırlayın:

- Bir Siemens `S7-1500` PLC veya simülatör
- `TIA Portal`
- Geliştirme makineniz ile PLC arasında ağ erişimi

Yazılım tarafında ise şunlar gerekli:

- Visual Studio
- Bir C# projesi, örneğin console app
- NuGet üzerinden kurulu `S7.NET` paketi

Bu temel parçalar hazır olduğunda kalan işin büyük bölümü doğru yapılandırma ve doğru adreslemedir.

## 2. PLC'yi dış erişime açın

S7-1500 varsayılan olarak dış istemcilere veri vermeye hazır değildir. Bu yüzden en kritik hazırlık adımı, ihtiyaç duyduğunuz haberleşme türünü etkinleştirmektir.

### PUT/GET iletişimini açın

`TIA Portal` içinde:

1. PLC yapılandırmasını açın.
2. Güvenlik veya koruma ayarlarına gidin.
3. `PUT/GET` üzerinden uzaktan erişimi etkinleştirin.
4. Güncel ayarları PLC'ye yükleyin.

Bu ayar açılmamışsa, kodunuz doğru olsa bile haberleşme başarısız olabilir.

## 3. Basit bir test DB'si oluşturun

İlk okuma için PLC tarafını bilinçli olarak sade tutun.

### Önerilen kurulum

1. `DB1` oluşturun.
2. `TestValue` gibi tek bir değişken ekleyin.
3. Tipini `INT` olarak belirleyin.
4. Adres düzeninin öngörülebilir olduğundan emin olun.

İlk denemelerde, adresler sabit kalsın ve eşleme kolay olsun diye optimized block access'i kapatmak çoğu zaman en temiz yaklaşımdır.

## 4. Bağlantı parametrelerini anlayın

`Plc` nesnesinin hedef cihaz hakkında birkaç temel bilgiye ihtiyacı vardır:

- CPU tipi
- PLC IP adresi
- Rack
- Slot

Tipik bir `S7-1500` için rack ve slot çoğu zaman `0` ve `1` olur; ancak IP adresinin cihazınızla tam eşleşmesi gerekir.

```csharp
using S7.Net;

var plc = new Plc(
    CpuType.S71500,
    "192.168.0.1",
    0,
    1
);
```

IP adresi yanlışsa, diğer tüm ayarlar doğru olsa bile bağlantı kurulmaz.

## 5. Bağlantıyı açın ve bir değer okuyun

İlk hedef büyük bir mimari kurmak değil, uygulamanın PLC ile konuşabildiğini ve tek bir alanı doğru okuyabildiğini doğrulamaktır.

```csharp
using S7.Net;
using System;

class Program
{
    static void Main()
    {
        var plc = new Plc(CpuType.S71500, "192.168.0.1", 0, 1);

        try
        {
            plc.Open();

            if (!plc.IsConnected)
            {
                Console.WriteLine("Bağlantı kurulamadı.");
                return;
            }

            short testValue = (short)plc.Read("DB1.DBW0");
            Console.WriteLine($"PLC değeri: {testValue}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"PLC hatası: {ex.Message}");
        }
        finally
        {
            if (plc.IsConnected)
            {
                plc.Close();
            }
        }
    }
}
```

Bu ilk başarılı okuma size şu alanlarda güven verir:

- cihaz erişilebilirliği,
- PLC güvenlik ayarları,
- adres doğruluğu,
- kütüphane kullanımının temel akışı.

## 6. Sorun giderme kontrol listesi

Okuma başarısız olursa şu maddeleri sırayla kontrol edin:

- PLC ağa gerçekten açık mı?
- IP adresi doğru mu?
- `PUT/GET` erişimi açık mı?
- DB adresi doğru mu?
- DB optimized durumda olduğu için adres bazlı okuma bozuluyor olabilir mi?
- Rack ve slot değerleri hedef cihaz için doğru mu?

İlk endüstriyel entegrasyonlarda sorunların büyük kısmı koddan değil, konfigürasyondan kaynaklanır.

## 7. Sonraki adım ne olmalı?

Basit okuma çalıştıktan sonra doğal ilerleme şunlardır:

- birden fazla ilişkili değeri okumak,
- blokları C# modellerine eşlemek,
- status word ve alarm alanlarını işlemek,
- polling veya event-driven veri akışları kurmak,
- üretim yükü için performansı iyileştirmek.

Tam bu noktada yapısal okuma yaklaşımı çok daha değerli hâle gelir.

## Sonuç

Bir Siemens S7-1500 ile C# uygulamasını konuşturmak karmaşık olmak zorunda değil. Küçük bir DB ile başlayın, PLC haberleşme ayarlarını doğru yapın, adres düzenini doğrulayın ve tek bir değeri uçtan uca başarıyla okuyun.

Bu ilk başarılı okuma; dashboard, makine izleme, endüstriyel API ve daha geniş OT/IT entegrasyonu çalışmalarının temelidir.
