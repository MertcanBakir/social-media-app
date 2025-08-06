# 📱 Social App - Mikroservis Mimarili Sosyal Medya Uygulaması

Bu proje, modern sosyal medya sistemlerinin nasıl mikroservis mimarisi ile modüler, ölçeklenebilir ve yönetilebilir şekilde geliştirileceğini gösteren kapsamlı bir örnektir.

Her bir servis kendi bağımsız veritabanına, iş mantığına ve mesajlaşma altyapısına sahiptir. 
Servisler arası iletişim Kafka üzerinden gerçekleşir. API Gateway tüm servislerin ortak erişim noktasıdır

---

## 🧰 Kullanılan Teknolojiler

| Teknoloji     | Açıklama |
|---------------|----------|
| **Node.js** / **Express** | Tüm servislerin temelini oluşturur. |
| **Kafka** + **Zookeeper** | Event-driven architecture için kullanılır. |
| **PostgreSQL** | Her servis kendi veritabanına sahiptir. |
| **Prisma ORM** | Servis bazlı şema yönetimi için güçlü ORM. |
| **JWT** | Kimlik doğrulama için güvenli token tabanlı yapı. |
| **API Gateway (http-proxy-middleware)** | Merkezi erişim noktası. |
| **Docker & Docker Compose** | Tüm sistemi izole şekilde ayağa kaldırmak için. |
| **Rate Limiting** | API Gateway’de IP bazlı istek sınırlama. |
| **Multer + Cloudinary** | Medya yüklemeleri (tweet resim/video). |
| **Monorepo (npm workspaces + turbo)** | Tüm servislerin tek repo altında verimli yönetimi. |

---

## 🧱 Proje Yapısı
