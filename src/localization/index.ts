import { usePreferences } from '@/context/PreferencesContext';

export const dictionaries = {
  tr: {
    // Navigation
    tabs: {
      trips: 'Geziler',
      discover: 'Keşfet',
      blog: 'Blog',
      profile: 'Profil',
    },
    // Auth
    auth: {
      login: 'Giriş Yap',
      register: 'Kayıt Ol',
      email: 'E-posta',
      password: 'Şifre',
      confirmPassword: 'Şifreyi Onayla',
      username: 'Kullanıcı Adı',
      signIn: 'Giriş Yap',
      signUp: 'Kayıt Ol',
      noAccount: 'Hesabınız yok mu? Kayıt Ol',
      hasAccount: 'Zaten hesabınız var mı? Giriş Yap',
      emailRequired: 'E-posta adresi boş olamaz',
      emailInvalid: 'Geçerli bir e-posta adresi girin',
      passwordRequired: 'Şifre boş olamaz',
      passwordLength: 'Şifre en az 8 karakter olmalıdır',
      passwordMatch: 'Şifreler eşleşmiyor',
      usernameRequired: 'Kullanıcı adı boş olamaz',
      usernameInvalid: 'Kullanıcı adı 3-24 karakter uzunluğunda olmalı ve sadece harf, rakam ve alt çizgi içerebilir',
      checkEmail: 'Doğrulama bağlantısını e-posta adresine gönderdik.',
      error: 'Bir hata oluştu',
      usernameTaken: 'Bu kullanıcı adı zaten alınmış.',
      emailTaken: 'Bu e-posta adresi zaten kullanılıyor.',
      passwordTooShort: 'Şifre çok kısa.',
      rateLimit: 'Çok fazla istek yapıldı. Lütfen daha sonra tekrar deneyin.',
      configError: 'Kayıt yapılandırma hatası (Redirect URL).',
      dbError: 'Veritabanı profil oluşturma hatası.',
    },
    // Profile
    profile: {
      title: 'Profil',
      settings: 'Ayarlar',
      theme: 'Tema',
      themeSystem: 'Sistem',
      themeLight: 'Açık',
      themeDark: 'Koyu',
      language: 'Dil',
      logout: 'Çıkış Yap',
    },
    // Common
    common: {
      loading: 'Yükleniyor...',
      emptyTrips: 'Henüz herkese açık bir gezi planı bulunmuyor.',
      emptyMyTrips: 'Henüz hiç gezin yok. Hemen bir tane oluştur!',
      publicTrips: 'Herkese Açık Geziler',
      myTrips: 'Gezilerim',
      blogDescription: 'Seyahat yazıları ve ipuçları burada olacak.',
    },
    // Trip
    trip: {
      newTrip: 'Yeni Gezi',
      createTrip: 'Gezi Oluştur',
      title: 'Başlık',
      description: 'Açıklama',
      startDate: 'Başlangıç Tarihi (GG.AA.YYYY)',
      endDate: 'Bitiş Tarihi (GG.AA.YYYY)',
      isPublic: 'Herkese Açık',
      isPrivate: 'Özel',
      createSuccess: 'Gezi başarıyla oluşturuldu',
      createError: 'Gezi oluşturulamadı',
      invalidDate: 'Lütfen geçerli bir tarih girin (Örn: 25.12.2026)',
      endDateBeforeStart: 'Bitiş tarihi başlangıçtan önce olamaz',
      titleTooShort: 'Başlık en az 2 karakter olmalıdır',
      titlePlaceholder: 'Örn: Yaz Tatili',
      descPlaceholder: 'Gezin hakkında kısa bir not...',
      datePlaceholder: 'DD.MM.YYYY',
      details: 'Gezi Detayı',
      dailyPlan: 'Günlük Plan',
      day: 'Gün',
      noPlansYet: 'Henüz plan eklenmedi.',
      notFound: 'Gezi bulunamadı.',
      fetchError: 'Gezi bilgileri yüklenemedi.',
    },
    // Trip Item
    item: {
      dayDetail: 'Gün Detayı',
      plans: 'Planlar',
      addPlan: 'Plan Ekle',
      createPlan: 'Plan Oluştur',
      planType: 'Plan Türü',
      title: 'Başlık',
      notes: 'Notlar',
      cost: 'Tutar',
      currency: 'Para Birimi',
      emptyDay: 'Bu gün için henüz plan eklenmedi.',
      fetchError: 'Planlar yüklenemedi.',
      invalidCurrency: 'Geçersiz para birimi (örn. TRY, USD)',
      negativeCost: 'Tutar 0 veya daha büyük olmalıdır',
      titleTooShort: 'Başlık en az 2 karakter olmalıdır',
      invalidTime: 'Geçerli bir saat girin (HH:mm).',
      endTimeBeforeStart: 'Bitiş saati başlangıç saatinden önce olamaz.',
      endTimeRequiresStart: 'Bitiş saati için başlangıç saati gereklidir.',
      startTime: 'Başlangıç Saati',
      endTime: 'Bitiş Saati',
      timePlaceholder: 'HH:mm',
      createSuccess: 'Plan eklendi',
      createError: 'Plan eklenirken hata oluştu',
      edit: 'Düzenle',
      editPlan: 'Planı Düzenle',
      saveChanges: 'Değişiklikleri Kaydet',
      delete: 'Sil',
      deletePlan: 'Planı Sil',
      deleteConfirm: 'Bu planı silmek istediğine emin misin?',
      cancel: 'Vazgeç',
      updateSuccess: 'Plan güncellendi',
      updateError: 'Plan güncellenemedi',
      deleteSuccess: 'Plan silindi',
      deleteError: 'Plan silinemedi',
      types: {
        place: 'Yer',
        restaurant: 'Restoran',
        accommodation: 'Konaklama',
        transport: 'Ulaşım',
        flight: 'Uçuş',
        train: 'Tren',
        bus: 'Otobüs',
        car: 'Araç',
        activity: 'Aktivite',
        note: 'Not',
      },
    },
  },
  en: {
    // Navigation
    tabs: {
      trips: 'Trips',
      discover: 'Discover',
      blog: 'Blog',
      profile: 'Profile',
    },
    // Auth
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      username: 'Username',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      noAccount: "Don't have an account? Register",
      hasAccount: 'Already have an account? Login',
      emailRequired: 'Email cannot be empty',
      emailInvalid: 'Enter a valid email address',
      passwordRequired: 'Password cannot be empty',
      passwordLength: 'Password must be at least 8 characters long',
      passwordMatch: 'Passwords do not match',
      usernameRequired: 'Username cannot be empty',
      usernameInvalid: 'Username must be 3-24 characters long and can only contain letters, numbers, and underscores',
      checkEmail: 'We have sent a verification link to your email address.',
      error: 'An error occurred',
      usernameTaken: 'This username is already taken.',
      emailTaken: 'This email is already in use.',
      passwordTooShort: 'Password is too short.',
      rateLimit: 'Too many requests. Please try again later.',
      configError: 'Registration configuration error (Redirect URL).',
      dbError: 'Database profile creation error.',
    },
    // Profile
    profile: {
      title: 'Profile',
      settings: 'Settings',
      theme: 'Theme',
      themeSystem: 'System',
      themeLight: 'Light',
      themeDark: 'Dark',
      language: 'Language',
      logout: 'Logout',
    },
    // Common
    common: {
      loading: 'Loading...',
      emptyTrips: 'There are no public trip plans yet.',
      emptyMyTrips: 'You have no trips yet. Create one now!',
      publicTrips: 'Public Trips',
      myTrips: 'My Trips',
      blogDescription: 'Travel articles and tips will be here.',
    },
    // Trip
    trip: {
      newTrip: 'New Trip',
      createTrip: 'Create Trip',
      title: 'Title',
      description: 'Description',
      startDate: 'Start Date (DD.MM.YYYY)',
      endDate: 'End Date (DD.MM.YYYY)',
      isPublic: 'Public',
      isPrivate: 'Private',
      createSuccess: 'Trip created successfully',
      createError: 'Failed to create trip',
      invalidDate: 'Please enter a valid date (e.g. 25.12.2026)',
      endDateBeforeStart: 'End date cannot be before start date',
      titleTooShort: 'Title must be at least 2 characters',
      titlePlaceholder: 'e.g. Summer Vacation',
      descPlaceholder: 'A short note about your trip...',
      datePlaceholder: 'DD.MM.YYYY',
      details: 'Trip Details',
      dailyPlan: 'Daily Plan',
      day: 'Day',
      noPlansYet: 'No plans added yet.',
      notFound: 'Trip not found.',
      fetchError: 'Unable to load trip.',
    },
    // Trip Item
    item: {
      dayDetail: 'Day Detail',
      plans: 'Plans',
      addPlan: 'Add Plan',
      createPlan: 'Create Plan',
      planType: 'Plan Type',
      title: 'Title',
      notes: 'Notes',
      cost: 'Cost',
      currency: 'Currency',
      emptyDay: 'No plans have been added for this day yet.',
      fetchError: 'Unable to load plans.',
      invalidCurrency: 'Invalid currency (e.g. TRY, USD)',
      negativeCost: 'Cost must be 0 or greater',
      titleTooShort: 'Title must be at least 2 characters',
      invalidTime: 'Enter a valid time (HH:mm).',
      endTimeBeforeStart: 'End time cannot be before start time.',
      endTimeRequiresStart: 'End time requires start time.',
      startTime: 'Start Time',
      endTime: 'End Time',
      timePlaceholder: 'HH:mm',
      createSuccess: 'Plan added',
      createError: 'Failed to add plan',
      edit: 'Edit',
      editPlan: 'Edit Plan',
      saveChanges: 'Save Changes',
      delete: 'Delete',
      deletePlan: 'Delete Plan',
      deleteConfirm: 'Are you sure you want to delete this plan?',
      cancel: 'Cancel',
      updateSuccess: 'Plan updated',
      updateError: 'Failed to update plan',
      deleteSuccess: 'Plan deleted',
      deleteError: 'Failed to delete plan',
      types: {
        place: 'Place',
        restaurant: 'Restaurant',
        accommodation: 'Accommodation',
        transport: 'Transport',
        flight: 'Flight',
        train: 'Train',
        bus: 'Bus',
        car: 'Car',
        activity: 'Activity',
        note: 'Note',
      },
    },
  },
};

export type Dictionary = typeof dictionaries.tr;

// Type-safe translation key resolution
type PathImpl<T, K extends keyof T> =
  K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends ArrayLike<any>
      ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
      : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never;

type Path<T> = PathImpl<T, keyof T> | keyof T;

export type TranslationKey = Path<Dictionary>;

export function useTranslation() {
  const { language } = usePreferences();
  
  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = dictionaries[language];
    
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t, language };
}
