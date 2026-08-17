# Architecture & Technical Stack

Bu belge, Travel Planner projesinin mevcut teknik mimarisini özetler. 

## Stack
*   **Mobile Framework:** React Native, Expo
*   **Routing:** Expo Router
*   **Language:** TypeScript (strict mode aktif)
*   **Backend / Database:** Supabase PostgreSQL / Auth / Storage
*   **Supabase Client:** `@supabase/supabase-js`
*   **Local Storage:** AsyncStorage (Session persistence için)
*   **Maps:** `@rnmapbox/maps`, `expo-location`
*   **Build System:** EAS Development Build
*   **Version Control:** Git / GitHub

## Klasör Yapısı (Özet)
*   `src/app/`: Expo Router kullanılarak tanımlanan ekranlar. (Navigation)
*   `src/components/`: Yeniden kullanılabilir UI bileşenleri.
*   `src/lib/`: Dış servislerin (Supabase, Mapbox vb.) merkezi yapılandırmaları.
*   `src/types/`: TypeScript tip tanımları (Generated Supabase tipleri vb.)
*   `supabase/migrations/`: Veritabanı şema değişiklikleri (Migration dosyaları).
*   `docs/`: Proje dokümantasyonu.

## Supabase (Database & Auth)
Mevcut ana tablolar:
*   `profiles`
*   `trips`
*   `trip_stops`

**ÖNEMLİ - Veritabanı Şeması:** 
Mevcut DB şeması nihai değildir. İleride `trip_days`, `trip_items`, `trip_members` gibi daha detaylı yapılara evrilmesi planlanmaktadır ancak bu tablolar henüz mevcut değildir.

*   **Migrations:** Veritabanı şema değişiklikleri yalnızca `supabase/migrations/` altındaki dosyalar üzerinden yürütülür.
*   **RLS (Row Level Security):** Core tablolar (trips, profiles vb.) için aktiftir.
*   **Generated Types:** Veritabanı tipleri `src/types/database.types.ts` dosyasında tutulur ve migration sonrası güncellenir.
*   **Client Initialization:** Supabase istemcisi `src/lib/supabaseClient.ts` dosyasında merkezi olarak yönetilir.

## Navigation
Mevcut yapı, **Expo Router** ve `expo-router/unstable-native-tabs` kütüphanesi üzerinden **NativeTabs** yaklaşımını kullanır.
Ana sekmeler `src/components/app-tabs.tsx` ve `src/components/app-tabs.web.tsx` üzerinden yönetilmekte ve `src/app/` altındaki `index.tsx`, `discover.tsx`, `blog.tsx`, `profile.tsx` rotaları ile eşleşmektedir.

## Maps (Mapbox)
*   **Initialization:** Mapbox kurulumu ve token yönetimi `src/lib/mapbox.ts` içinde merkezi olarak yapılır.
*   **Native Dependency:** Mapbox native bir kütüphane olduğundan, Expo Go ile çalışmaz; **yeni bir Development Build gerektirir**.

## Environment Variables
Environment değerleri kod içerisinde gizli tutulmamalı, `.env` dosyaları üzerinden yönetilmelidir:

*   `EXPO_PUBLIC_SUPABASE_URL`
*   `EXPO_PUBLIC_SUPABASE_ANON_KEY`
*   `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`

> Secret değerler `.env.example` veya dokümantasyon dosyalarına yazılmamalıdır. Sadece değişken isimleri bulundurulmalıdır.
