---
layout: post
lang: tr
title: "Kompleks Veri Manipülasyonu için İleri Seviye LINQ Teknikleri"
description: "Deferred execution, projection, join, grouping, paging, flattening ve custom aggregation gibi ileri seviye LINQ tekniklerini pratik örneklerle inceleyin."
date: 2024-10-22 12:00:00 +0300
permalink: /tr/blog/kompleks-veri-manipulasyonu-icin-ileri-seviye-linq-teknikleri/
en_url: /blog/advanced-linq-techniques-for-complex-data-manipulation/
tr_url: /tr/blog/kompleks-veri-manipulasyonu-icin-ileri-seviye-linq-teknikleri/
translation_key: "advanced-linq"
keywords: ["LINQ", "C#", ".NET", "Join", "Grouping", "Projection", "Aggregation"]
tags: ["linq", "csharp", "dotnet", "querying", "performance"]
original_url: "https://dev.to/ferhatacar/advanced-linq-techniques-for-complex-data-manipulation-301i"
seo:
  type: BlogPosting
---

## Giriş

Temel LINQ; filtreleme ve sıralama için yeterlidir, ancak gerçek sistemler çok daha fazlasını ister. Farklı veri kaynaklarını birleştirmeye, taşınan veri miktarını azaltmaya, iç içe koleksiyonları düzleştirmeye veya iş kurallarını sorgu diliyle ifade etmeye başladığınızda, ileri seviye LINQ teknikleri büyük değer üretir.

Bu yazıda en sık başvurduğum kalıpları toparlıyorum.

## 1. Deferred execution

Deferred execution, sorguyu hemen çalıştırmadan kademeli olarak kurmanıza imkân verir.

```csharp
var query = context.Employees
    .Where(e => e.Age > 30)
    .OrderBy(e => e.Name);

foreach (var employee in query)
{
    Console.WriteLine(employee.Name);
}
```

### Neden önemli?

- Sorguyu adım adım birleştirebilirsiniz.
- İşlem, sonuçlar enumerate edildiğinde gerçekleşir.
- Maliyetli materialization en son ana kadar ertelenebilir.

Asıl mesele, tembelliği ne zaman koruyacağınızı ve ne zaman bilinçli şekilde materialize edeceğinizi bilmektir.

## 2. Verimli projection

Projection, sorgu çıktısını gerçekten ihtiyacı olan tüketiciyle hizalar.

```csharp
var employeeDetails = context.Employees
    .Where(e => e.Age > 30)
    .Select(e => new { e.Name, e.Position })
    .ToList();
```

Bu yaklaşım özellikle liste ve dashboard senaryolarında veri transfer maliyetini ve bellek kullanımını azaltır.

## 3. İlişkili veriler için join kullanımı

LINQ join ifadeleri, ilişkili veri kümelerini okunabilir biçimde birleştirmenizi sağlar.

```csharp
var query =
    from emp in context.Employees
    join dept in context.Departments
        on emp.DepartmentId equals dept.Id
    select new { emp.Name, dept.DepartmentName };
```

### İyi kullanım alanları

- raporlama sorguları,
- bileşik görünümler,
- özel şekilli API yanıtları.

## 4. Null değerleri güvenli yönetmek

Opsiyonel veri hemen her iş sisteminde vardır. Bunu görmezden gelirseniz kırılgan sorgular üretirsiniz.

```csharp
var employees = context.Employees
    .Select(e => new
    {
        e.Name,
        ManagerName = e.Manager != null ? e.Manager.Name : "Yönetici yok"
    })
    .ToList();
```

Açık null yönetimi hem projection'ı güvenli tutar hem de niyeti görünür kılar.

## 5. Gruplama ve özetleme

Grouping, ham kayıtları iş açısından anlamlı özetlere dönüştürmenin en değerli yollarından biridir.

```csharp
var departmentCounts = context.Employees
    .GroupBy(e => e.DepartmentId)
    .Select(g => new
    {
        DepartmentId = g.Key,
        Count = g.Count()
    })
    .ToList();
```

Tüketici ham satır yerine toplam, kategori veya bucket bazlı bilgi istiyorsa grouping doğru araçtır.

## 6. İç içe koleksiyonları düzleştirmek

Bir parent entity child koleksiyon taşıyorsa `SelectMany` en doğal operatördür.

```csharp
var orderLines = customers
    .SelectMany(c => c.Orders)
    .SelectMany(o => o.Lines)
    .ToList();
```

Bu yaklaşım özellikle şu durumlarda yararlıdır:

- iç içe veriyi export ederken,
- analitik girdisi hazırlarken,
- farklı parent'lardaki child kayıtlarını tek listede toplarken.

## 7. Büyük sonuç kümelerinde paging

`Skip` ve `Take`, UI pagination veya büyük API sonuçları için vazgeçilmezdir.

```csharp
var pageNumber = 2;
var pageSize = 25;

var page = context.Employees
    .OrderBy(e => e.Name)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToList();
```

Kararlı bir `OrderBy` olmadan paging yapmak çoğu zaman hatadır; bu yüzden sıralamayı açık tutun.

## 8. Küme işlemleri

LINQ, dizileri karşılaştırmak ve birleştirmek için de güçlü araçlar sunar.

```csharp
var newIds = requestedIds.Except(existingIds).ToList();
var sharedIds = requestedIds.Intersect(existingIds).ToList();
var allIds = requestedIds.Union(existingIds).ToList();
```

Bu operatörler senkronizasyon, mutabakat ve doğrulama akışlarında çok kullanışlıdır.

## 9. Özel toplama işlemleri

Hazır özetleme operatörleri yetmediğinde `Aggregate` tam kontrol sunar.

```csharp
var totalExperience = context.Employees
    .Select(e => e.ExperienceYears)
    .Aggregate((acc, value) => acc + value);
```

Custom aggregation güçlüdür; ancak okunabilir kalmalıdır. Mantık fazla yoğunlaştığında isimlendirilmiş bir metoda taşımak daha iyidir.

## Sonuç

İleri seviye LINQ kullanımı “akıllı görünmek” için değil, karmaşık veri davranışını açık şekilde ifade etmek için değerlidir.

Deferred execution, projection, join, grouping, flattening, paging, küme işlemleri ve aggregation konularında rahatladığınızda LINQ yalnızca pratik bir sözdizimi olmaktan çıkar. Veri yoğun uygulamalarda güvenilir bir tasarım aracına dönüşür.
