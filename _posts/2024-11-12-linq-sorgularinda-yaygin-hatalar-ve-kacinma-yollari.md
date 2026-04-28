---
layout: post
lang: tr
title: "LINQ Sorgularında Yaygın Hatalar ve Kaçınma Yolları"
description: "Deferred execution, projection, null yönetimi, grouping ve veritabanı performansı ekseninde en sık görülen LINQ hataları ve pratik çözümleri."
date: 2024-11-12 12:00:00 +0300
permalink: /tr/blog/linq-sorgularinda-yaygin-hatalar-ve-kacinma-yollari/
en_url: /blog/common-pitfalls-in-linq-queries-and-how-to-avoid-them/
tr_url: /tr/blog/linq-sorgularinda-yaygin-hatalar-ve-kacinma-yollari/
translation_key: "linq-pitfalls"
keywords: ["LINQ", "C#", ".NET", "Entity Framework", "SQL performansı", "Sorgu tasarımı"]
tags: ["linq", "csharp", "dotnet", "entity-framework", "performance"]
original_url: "https://dev.to/ferhatacar/common-pitfalls-in-linq-queries-and-how-to-avoid-them-42dd"
seo:
  type: BlogPosting
---

## Giriş

LINQ, .NET ekosisteminin en verimli araçlarından biridir; ancak bu verim bazen pahalı hataları görünmez kılar. İlk bakışta zarif görünen bir sorgu; gereksiz maliyetli, bakımı zor veya verimsiz SQL üretiyor olabilir.

Burada en sık gördüğüm hataları ve bunlardan kaçınmak için işe yarayan alışkanlıkları topladım.

## 1. Sorguyu gereğinden erken çalıştırmak

Deferred execution güçlüdür, çünkü sorgu gerçekten ihtiyaç duyulana kadar çalıştırılmaz. Sorun, `ToList()`, `ToArray()` veya `ToDictionary()` gibi çağrıların gereğinden erken yapılmasıyla başlar.

```csharp
var query = context.Customers
    .Where(c => c.IsActive)
    .OrderBy(c => c.Name);

foreach (var customer in query)
{
    Console.WriteLine(customer.Name);
}
```

### Daha iyi yaklaşım

- Sorguyu mümkün olduğunca birleştirilebilir tutun.
- Sonucu belleğe yalnızca gerçekten gerekiyorsa alın.

## 2. `Select` kullanımını gereksiz yere çoğaltmak

Projection çok değerlidir; ancak gereksiz ara projection'lar kodu daha gürültülü hâle getirir ve çevirinin nasıl çalıştığını anlamayı zorlaştırır.

```csharp
var names = context.Customers
    .Where(c => c.IsActive)
    .Select(c => c.Name)
    .ToList();
```

### Daha iyi yaklaşım

- Mümkünse tek projection ile ilerleyin.
- Projection yapısını gerçekten ihtiyacı olan tüketiciye göre kurun.

## 3. Performans etkisini görmezden gelmek

LINQ, büyük veri setlerinde çok hızlı şekilde maliyetli hâle gelebilir.

Sık görülen performans tuzakları:

- aynı diziyi birden fazla kez enumerate etmek,
- sorgu içinde ağır client-side işlemler yapmak,
- gerekenden fazla kolon çekmek,
- veritabanında yapılabilecek işi belleğe taşımak.

```csharp
var highValueCustomers = context.Customers
    .Where(c => c.PurchaseAmount > 1000)
    .ToList();
```

### Daha iyi yaklaşım

- Filtreleme ve projection'ı mümkün olduğunca veritabanında bırakın.
- Tahmin etmek yerine yoğun sorgu akışlarını profile edin.
- Kritik sorgularda üretilen SQL'i kontrol edin.

## 4. Projection yeterliyken tüm entity'yi çekmek

Arayüzün yalnızca birkaç alana ihtiyacı varsa, tam entity çekmek bellek kullanımını ve veri transfer maliyetini gereksiz yere artırır.

```csharp
var customerNames = context.Customers
    .Where(c => c.IsActive)
    .Select(c => new { c.Id, c.Name })
    .ToList();
```

### Daha iyi yaklaşım

- Liste, dashboard ve özet ekranlarda hafif projection'lar kullanın.
- Tam entity'yi yalnızca gerçekten tüm nesne grafiğine ihtiyaç varsa çekin.

## 5. Aşırı karmaşık sorgular yazmak

Büyük LINQ ifadeleri test etmeyi, açıklamayı ve optimize etmeyi zorlaştırır. ORM ile kullanıldığında kötü SQL üretme ihtimalini de artırır.

```csharp
var activeCustomers = context.Customers.Where(c => c.IsActive);
var highValueCustomers = activeCustomers.Where(c => c.PurchaseAmount > 1000);
```

### Daha iyi yaklaşım

- Karmaşık mantığı isimlendirilmiş sorgu parçalarına ayırın.
- Tekrarlanan kalıpları helper veya extension method ile soyutlayın.

## 6. `null` durumlarını açık yönetmemek

Özellikle opsiyonel ilişkilerden veya kısmen dolu verilerden gelen sonuçlarda null kaynaklı sürprizler kolayca gözden kaçar.

```csharp
var customerNames = context.Customers
    .Select(c => c.Name ?? "Unknown")
    .ToList();
```

### Daha iyi yaklaşım

- Varsayılan değer makulse null-coalescing kullanın.
- Opsiyonel ilişkileri şansa bırakmak yerine açık şekilde yönetin.

## 7. Veritabanı davranışını unutmak

Okunabilir bir LINQ sorgusu otomatik olarak iyi bir SQL sorgusu anlamına gelmez. Soyutlama faydalıdır; ama join, include, index veya N+1 problemlerini anlamaya duyulan ihtiyacı ortadan kaldırmaz.

```csharp
var customers = context.Customers
    .Include(c => c.Orders)
    .Where(c => c.IsActive)
    .ToList();
```

### Daha iyi yaklaşım

- `Include` kullanımını bilinçli yapın.
- Gereğinden fazla veri çekilip çekilmediğini izleyin.
- Index'lerin ve sorgu şeklinin erişim modelini desteklediğini doğrulayın.

## 8. `GroupBy` kullanımını yanlış yerde yapmak

Asıl amaç veritabanında gruplu çıktı üretmekken grouping işlemini bellekte yapmak, yönetilebilir bir sorguyu gereksiz bellek problemine dönüştürebilir.

```csharp
var customerGroups = context.Customers
    .GroupBy(c => c.City)
    .Select(g => new { City = g.Key, Count = g.Count() })
    .ToList();
```

### Daha iyi yaklaşım

- Mümkünse grouping'i veritabanında bırakın.
- Provider'ın bu ifadeyi beklediğiniz gibi çevirdiğini kontrol edin.

## 9. Asenkron yöntemleri kullanmamak

I/O ağırlıklı uygulama kodunda senkron veritabanı çağrıları ölçeklenebilirliği düşürür ve gereksiz bloklamaya neden olur.

```csharp
var customers = await context.Customers
    .Where(c => c.IsActive)
    .ToListAsync();
```

### Daha iyi yaklaşım

- Web uygulamaları ve servis katmanlarında async query API'lerini tercih edin.
- Tüm çağrı zinciri non-blocking kalacak şekilde tutarlı ilerleyin.

## 10. Aynı sorgu niyetini her yerde tekrar etmek

Aynı filtre sürekli tekrar ediyorsa sorun çoğu zaman LINQ sözdizimi değildir; eksik soyutlamadır.

```csharp
public static class CustomerExtensions
{
    public static IQueryable<Customer> ActiveCustomers(this IQueryable<Customer> query)
    {
        return query.Where(c => c.IsActive);
    }
}
```

### Daha iyi yaklaşım

- Tekrarlanan sorgu kalıplarını kapsülleyin.
- İş dilini sorgu yüzeyinde görünür tutun.

## Sonuç

LINQ en iyi sonucu zarafet ile disiplin birlikte yürüdüğünde verir. Deferred execution'ı doğru anlayın, yalnızca ihtiyacınız olan alanları seçin, veritabanı davranışını akılda tutun ve tekrar eden niyeti yeniden kullanılabilir kalıplara taşıyın.

Böylece yalnızca okunabilir değil, aynı zamanda verimli ve sürdürülebilir LINQ sorguları elde edersiniz.
