---
layout: post
lang: tr
title: "LINQ Sorgularında Performans Optimizasyonu: İpuçları ve En İyi Pratikler"
description: "Execution davranışı, gereksiz enumeration, projection, filtreleme ve profiling odağında LINQ performansını iyileştirmek için pratik öneriler."
date: 2023-07-11 12:00:00 +0300
permalink: /tr/blog/linq-sorgularinda-performans-optimizasyonu-ipuclari-ve-en-iyi-pratikler/
en_url: /blog/performance-optimization-in-linq-queries-tips-and-best-practices/
tr_url: /tr/blog/linq-sorgularinda-performans-optimizasyonu-ipuclari-ve-en-iyi-pratikler/
translation_key: "linq-performance"
keywords: ["LINQ", "Performans", ".NET", "C#", "Deferred execution", "Sorgu optimizasyonu"]
tags: ["programming", "tutorial", "linq", "performance"]
original_url: "https://dev.to/ferhatacar/performance-optimization-in-linq-queries-tips-and-best-practices-5c5"
seo:
  type: BlogPosting
---

## Giriş

LINQ okunabilirliği ve üretkenliği artırır; ancak maliyet düşünme ihtiyacını ortadan kaldırmaz. Sorgunun ne zaman çalıştığı, nasıl çalıştığı ve ne kadar veri taşıdığı performansı doğrudan etkiler.

Uygulamanız LINQ'e yoğun şekilde dayanıyorsa, küçük kararlar bile çalışma zamanında belirgin fark yaratabilir.

## 1. Execution davranışını anlayın

LINQ genel olarak iki modda çalışır:

- **Deferred execution**: sorgu enumerate edildiğinde çalışır
- **Immediate execution**: terminal bir operatör sorguyu hemen çalıştırır

```csharp
var numbers = new List<int> { 1, 2, 3, 4, 5 };
var evenNumbers = numbers.Where(n => n % 2 == 0);

foreach (var number in evenNumbers)
{
    Console.WriteLine(number);
}
```

Buna karşılık `ToList()`, `ToArray()`, `First()` ve `Count()` gibi metotlar sorguyu anında çalıştırır.

Bu farkı anlamak, istemeden yapılan işleri azaltır.

## 2. Gereksiz enumeration'dan kaçının

En kolay LINQ hatalarından biri, bir diziyi gerekenden fazla taramaktır.

```csharp
if (numbers.Any())
{
    // do something
}
```

Bu yaklaşım çoğu zaman şundan daha iyidir:

```csharp
if (numbers.Count() > 0)
{
    // do something
}
```

### Neden?

- `Count()` tüm diziyi dolaşmak zorunda kalabilir.
- `Any()` ilk elemanı bulduğu anda döner.

Veri büyüdükçe bu fark daha görünür hâle gelir.

## 3. Filtreyi erken uygulayın

Veri kümesini sorgu zincirinin mümkün olduğunca erken aşamasında küçültün.

```csharp
var result = context.Orders
    .Where(o => o.Total > 1000)
    .Select(o => new { o.Id, o.Total })
    .ToList();
```

### Daha iyi yaklaşım

- Maliyetli dönüşümlerden önce filtreleyin.
- Materialize etmeden önce filtreleyin.
- Gereksiz satırların belleğe gelmesini engelleyin.

## 4. Yalnızca gereken alanları seçin

Projection sadece daha temiz değil, çoğu zaman daha hızlıdır.

```csharp
var customers = context.Customers
    .Select(c => new { c.Id, c.Name })
    .ToList();
```

Liste ekranı veya özet endpoint için tam entity çekmek, bellek ve veri transferini gereksiz artırır.

## 5. Client-side iş yüküne dikkat edin

Entity Framework gibi bir sağlayıcıyla çalışırken, her C# ifadesi beklediğiniz şekilde çevrilmeyebilir.

### Riskli alanlar

- sorgu içindeki custom method çağrıları,
- karmaşık bellek içi dönüşümler,
- veritabanı dışında çalışmaya zorlayan mantıklar.

### Daha iyi yaklaşım

- Çevrilebilir mantığı provider sorgusu içinde tutun.
- Gerekirse bellek içi mantığı materialization sonrasına taşıyın.

## 6. Sorgu şeklini sade tutun

Okunabilir sorgular optimize etmesi daha kolay sorgulardır.

- Büyük ifadeleri adımlara ayırın.
- Önemli ara filtreleri isimlendirin.
- Gereksiz operatör zincirlerinden kaçının.

Sorgu niyeti net olduğunda optimizasyon çok daha kolaylaşır.

## 7. Tahmin etmek yerine ölçün

Ölçüm olmadan yapılan performans iyileştirmesi çoğu zaman varsayımdan ibarettir.

Faydalı kontroller şunlardır:

- üretilen SQL'i incelemek,
- hot path'leri ölçmek,
- allocation davranışını görmek,
- alternatif sorgu şekillerini gerçek veri boyutlarında karşılaştırmak.

Amaç her yerde mikro optimizasyon yapmak değil, gerçek maliyetin nerede olduğunu bilmek olmalıdır.

## Sonuç

LINQ hem ifade gücü yüksek hem de hızlı olabilir; ama bunun için execution davranışı, enumeration sayısı, projection boyutu ve sorgu çevirisi konularında bilinçli olmak gerekir.

Birkaç disiplinli alışkanlık, .NET uygulamalarını okunabilir tutarken gereksiz performans maliyetlerinden kaçınmanızı sağlar.
