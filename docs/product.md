# Travel Planner - Product Overview

Travel Planner, kullanıcıların harita merkezli, gün gün detaylandırılabilen seyahat planları (tripler) oluşturmasını, yeni yerler keşfetmesini ve seyahat yazılarını (blog) paylaşmasını sağlayan bir mobil uygulamadır.

## Ana Ürün Alanları

### 1. Trips
*   **MVP Özellikleri:**
    *   Kullanıcı seyahat (trip) oluşturabilecek.
    *   Harita merkezli planlama yapılacak.
    *   Mekanlar seçilebilecek.
    *   Gün gün planlama olacak.
    *   Konaklama, ulaşım, aktiviteler, yemek vb. eklenebilecek.
    *   Rota oluşturulabilecek.
    *   Plan düzenleme/silme olacak.
*   **İlerleyen Aşamalar (Future):**
    *   Trip paylaşımı ve ortak planlama (collaboration).

### 2. Discover
*   **MVP Özellikleri:**
    *   Şehir/ülke/mekan keşfi.
    *   Mekan bilgileri.
    *   Keşfedilen mekanı Trip'e ekleme.
*   **İlerleyen Aşamalar (Future):**
    *   Kaydetme/beğenme gibi özellikler.

### 3. Blog
*   **MVP Özellikleri:**
    *   Kullanıcı seyahat yazıları.
    *   Yazıları spesifik bir Trip ile ilişkilendirme.
*   **İlerleyen Aşamalar (Future):**
    *   Beğeni/yorum/kaydetme özellikleri.

### 4. Profile
*   **MVP Özellikleri:**
    *   Kullanıcı profili görüntüleme.
    *   Kullanıcının kendi gezileri ve yazıları.
    *   Ayarlar.

## Mevcut "Foundation" Durumu (Day 1)
Şu anda MVP aşamasına geçiş için aşağıdaki teknik temeller atılmıştır:

*   **Platform:** Expo / React Native
*   **Dil:** TypeScript (strict mode)
*   **Navigation:** Expo Router (Trips / Discover / Blog / Profile ana sekmeleri)
*   **Database & Backend:** Supabase connection, Supabase migrations altyapısı, RLS (Row Level Security) aktif.
*   **Veri Tipleri:** Generated DB types (Supabase)
*   **Auth:** Auth session persistence infrastructure
*   **Harita:** Mapbox native integration (`@rnmapbox/maps` & `expo-location`)
*   **Build:** Android Expo Development Build uyumlu.

> **Önemli Not:** Yukarıda "İlerleyen Aşamalar" veya MVP özellikleri olarak listelenen fonksiyonların birçoğu henüz geliştirilmemiştir. Sadece temel altyapı kodları mevcuttur.
