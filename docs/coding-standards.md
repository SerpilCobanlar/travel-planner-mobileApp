# Coding Standards & Guidelines

Takım için ortak kodlama standartları ve AI/geliştirici kuralları.

## Genel Kurallar ve AI Agent Kuralı
> **AI Kodlama Asistanları İçin Kritik Kural:**
> Önce mevcut kodu incele, mevcut çalışan mimariyi körlemesine değiştirme.

## TypeScript ve Kalite
*   **TypeScript Strict:** Projede strict mode aktiftir ve kurallarına uyulmalıdır.
*   **No `any`:** `any` kullanımından kesinlikle kaçınılmalıdır. Gerekirse uygun interfaceler veya `unknown` kullanılmalıdır.

## Supabase ve Veritabanı
*   **Manuel Değişiklik Yok:** `src/types/database.types.ts` manuel olarak düzenlenmez.
*   **Migrations Sadece:** DB schema değişiklikleri daima Supabase migration dosyaları ile yapılır. Supabase Dashboard üzerinden manuel schema değişikliği yapmaktan kaçınılır.
*   **Regenerate Types:** Migration sonrasında mutlaka veritabanı tipleri yeniden generate edilir.
*   **Merkezi İstemci:** Supabase bağlantısı her dosyada tekrar oluşturulmaz, `src/lib/supabaseClient.ts` kullanılır.

## Çevresel Değişkenler (Environment Variables)
*   **Secret Güvenliği:** Env secret'ları Git'e kesinlikle commit edilmez (Sadece lokal `.env.local` dosyasında tutulur).
*   **Example Dosyası:** `.env.example` sadece variable isimlerini (key) içerir, gerçek değerleri içermez.

## UI ve Mimari
*   **Küçük Componentler:** UI componentleri olabildiğince küçük, modüler ve yeniden kullanılabilir tutulur (`src/components/` altında).
*   **Temiz Rotalar:** Expo Router route (ekran) dosyalarında gereksiz business logic tutulmaz. İş mantığı hooklara veya helper fonksiyonlara taşınır.
*   **Merkezi Servisler:** Supabase, Mapbox vb. dış servis entegrasyonları `src/lib/` altında merkezi bir yerde tutulur.

## Dependency (Paket) Yönetimi
*   **Gereksinim Değerlendirmesi:** Yeni bir dependency (paket) eklemeden önce gerçekten gerekli olup olmadığı sıkıca değerlendirilir.
*   **Native Dependencies:** Eğer projeye native kod içeren yeni bir paket eklenirse, bunun çalışması için mutlaka **yeni bir Development Build (EAS/Local)** gerektiğini unutmayın. Expo Go kullanılamaz.

## Version Control (Git) ve Workflow
*   **Feature Branches:** Meaningful (anlamlı) yeni feature'lar mutlaka ayrı bir branch üzerinden geliştirilir.
*   **Commit Mesajları:** Küçük, odaklı ve ne yapıldığını açıkça anlatan commit mesajları kullanılır.
*   **PR Öncesi Kontroller:** Feature tamamlanmadan ve merge edilmeden önce her zaman şu komutlar çalıştırılıp hatasız olduğu doğrulanmalıdır:
    *   `npm run typecheck`
    *   `npm run lint`
*   **No Over-engineering:** Gereksiz büyük refactor yapmaktan kaçınılır. Sadece ihtiyaç duyulan kadar kod yazılır.
