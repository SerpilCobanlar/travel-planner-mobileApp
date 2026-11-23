# Travel Planner

Arkadaş gruplarıyla geziyi harita üzerinde gün gün birlikte planlamaya yarayan mobil uygulama. Trip oluşturulunca günler otomatik açılır; her güne konaklama, ulaşım, yemek, aktivite gibi planlar (saat, maliyet, konum) eklenir ve günün planları haritada rota olarak gösterilir.

Ürün vizyonu ve yol haritası: [docs/product.md](docs/product.md) · [Issues](https://github.com/SerpilCobanlar/travel-planner-mobileApp/issues) · [Milestones](https://github.com/SerpilCobanlar/travel-planner-mobileApp/milestones)

## Teknoloji

| Alan | Kullanılan |
|---|---|
| Uygulama | Expo (SDK 57), React Native, TypeScript (strict) |
| Navigasyon | Expo Router (native tabs) |
| Backend | Supabase: PostgreSQL, Auth, RLS |
| Harita | Mapbox (`@rnmapbox/maps`, Directions API), `expo-location` |
| Build | EAS development build |

Ayrıntılar: [docs/architecture.md](docs/architecture.md) · Kurallar: [docs/coding-standards.md](docs/coding-standards.md)

## Kurulum

**Gereksinimler:** Node 22 (`.nvmrc`: 22.14.0), Android cihaz veya emülatör.

> Mapbox ve tarih seçici native paketler olduğu için uygulama **Expo Go ile çalışmaz**; development build gerekir. Native bir paket eklendiğinde/güncellendiğinde yeni build alınmalıdır.

1. Bağımlılıkları kur:
   ```bash
   npm install
   ```
2. `.env.example`'ı `.env.local` olarak kopyala ve değerleri doldur (Supabase proje URL'i ve anon key, Mapbox public token). `.env.local` git'e girmez.
3. Development build al ve telefona kur (ilk seferde ve native paket değişince):
   ```bash
   npx eas-cli build --profile development --platform android
   ```
4. Geliştirme sunucusunu başlat:
   ```bash
   npx expo start --dev-client
   ```

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm start` | Expo geliştirme sunucusu |
| `npm run typecheck` | TypeScript kontrolü (`tsc --noEmit`) |
| `npm run lint` | ESLint (`expo lint`) |

Her PR'da typecheck ve lint GitHub Actions ile otomatik çalışır.

## Veritabanı (Supabase)

- Şema değişiklikleri **sadece** `supabase/migrations/` altındaki migration dosyalarıyla yapılır; Dashboard'dan elle şema değiştirilmez.
- Migration sonrası tipler yeniden üretilir ve `src/types/database.types.ts` elle düzenlenmez:
  ```bash
  npx supabase gen types typescript --linked > src/types/database.types.ts
  ```
- Veritabanı testleri yalnızca **lokal** Supabase'e karşı çalışır:
  ```bash
  npx supabase start
  node supabase/tests/trip-days-sync.test.mjs
  ```

## Çalışma düzeni

- `main` korumalıdır: değişiklikler `feat/…`, `fix/…`, `chore/…` branch'lerinde yapılır ve PR ile gelir.
- Her PR diğer ekip üyesinin onayını ve yeşil CI'ı gerektirir. PR açıklamasına `Closes #numara` yazılınca ilgili issue merge ile kapanır.
- Güne başlarken `git pull origin main`; branch'ler kısa ömürlü tutulur.

## Klasör yapısı

```
src/app/          Ekranlar (Expo Router)
src/components/   Yeniden kullanılabilir bileşenler (ui/ altında temel bileşenler)
src/context/      Auth ve tercih (tema/dil) context'leri
src/lib/          Supabase, Mapbox ve yardımcı servisler
src/localization/ TR/EN çeviriler
src/types/        Üretilmiş veritabanı tipleri ve global tip tanımları
supabase/         Migration'lar, lokal config ve testler
docs/             Ürün, mimari ve kodlama dokümanları
```
