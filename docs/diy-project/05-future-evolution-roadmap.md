# 05. Future Evolution Roadmap (ভবিষ্যতের অ্যাডভান্সড ফিচার ও AI ইন্টিগ্রেশন)

তুমি যখন **EventPulse-Lite**-এর বেসিক ইন-মেমোরি প্রজেক্টটি নিজে নিজে তৈরি করে ফেলবে, তখন তোমার NestJS আর্কিটেকচার, DTO, পাইপ, মিডলওয়্যার এবং গার্ডের ভিত্তি অনেক মজবুত হয়ে যাবে।

এরপর এই প্রজেক্টটিকে একটি পূর্ণাঙ্গ, রিয়েল-ওয়ার্ল্ড ও প্রোডাকশন-রেডি সিস্টেমে রূপান্তরিত করার জন্য নিচের রোডম্যাপটি অনুসরণ করবে।

---

```
  [ Phase 1: DIY Foundation ]
     (In-Memory + CLI + DTO + Guards)
                  │
                  ▼
  [ Phase 2: Persistent Storage ]
     (PostgreSQL + TypeORM / Prisma + Migrations)
                  │
                  ▼
  [ Phase 3: Production Security ]
     (JWT Authentication + Passport + RBAC Roles)
                  │
                  ▼
  [ Phase 4: AI Superpowers ]
     (Gemini API / LLM Description Generator + Semantic Search)
                  │
                  ▼
  [ Phase 5: Scalability & DevOps ]
     (Swagger OpenAPI + Docker + Rate Limiting)
```

---

## ১. Evolution Step A: আসল ডেটাবেজ ইন্টিগ্রেশন (Database Persistence)

### কেন দরকার?
বর্তমান ইন-মেমোরি সিস্টেমে সার্ভার রিস্টার্ট দিলে সব ইভেন্ট হারিয়ে যায়। প্রোডাকশনে ডেটা স্থায়ী রাখতে রিলেশনাল ডেটাবেজ (যেমন: PostgreSQL) প্রয়োজন।

### আর্কিটেকচারাল পরিবর্তন:
1. **Interface থেকে Entity-তে রূপান্তর:**
   `event.interface.ts`-এর জায়গায় TypeORM বা Prisma Entity তৈরি হবে:
   ```typescript
   // TypeORM Entity উদাহরণ ধারণা:
   @Entity('events')
   export class EventEntity {
     @PrimaryGeneratedColumn()
     id: number;

     @Column()
     title: string;

     @Column({ type: 'enum', enum: EventStatus, default: EventStatus.UPCOMING })
     status: EventStatus;
     // ... অন্যান্য কলাম
   }
   ```
2. **Repository Pattern:**
   `EventsService`-এ ইন-মেমোরি অ্যারে বাদ দিয়ে TypeORM-এর `@InjectRepository(EventEntity) private readonly eventRepo: Repository<EventEntity>` ইনজেক্ট করা হবে।
   - `this.events.find(...)` এর জায়গায় হবে `await this.eventRepo.findOneBy({ id })`।
   - `this.events.push(...)` এর জায়গায় হবে `await this.eventRepo.save(newEvent)`।

---

## ২. Evolution Step B: রিয়েল JWT অথেনটিকেশন ও রোল-বেজড অ্যাক্সেস (RBAC)

### কেন দরকার?
বর্তমানে আমরা সাধারণ হেডার (`x-admin-key: organizer-secret-key`) দিয়ে চেক করছি। বাস্তব প্রজেক্টে সুরক্ষিত পাসওয়ার্ড হ্যাশিং ও JWT টোকেন প্রয়োজন।

### আর্কিটেকচারাল পরিবর্তন:
1. **User Entity তৈরি:**
   - `User` মডেলে থাকবে: `id`, `email`, `password` (bcrypt দিয়ে হ্যাশ করা), `role` (`'ADMIN' | 'ATTENDEE'`).
2. **Auth Module স্ক্যাফোল্ড:**
   - `POST /api/auth/register` (নতুন অ্যাকাউন্ট তৈরি)।
   - `POST /api/auth/login` (ইমেইল ও পাসওয়ার্ড মিলিয়ে একটি স্বাক্ষরিত JWT Bearer Token রিটার্ন করবে)।
3. **Roles Guard & Custom Decorator:**
   - `@Roles('ADMIN')` নামক কাস্টম ডেকোরেটর এবং `RolesGuard` তৈরি করে `PATCH /api/events/:id/cancel` রুটে বসানো হবে।
   - সাধারণ ইউজার (`ATTENDEE`) শুধুমাত্র নিজের জন্য সিট বুক করতে পারবে (`PATCH /api/events/:id/book`)।

---

## ৩. Evolution Step C: কৃত্রিম বুদ্ধিমত্তা (AI) ইন্টিগ্রেশন

NestJS আর্কিটেকচারে AI ফিচার যুক্ত করা অত্যন্ত চমৎকার ও ক্লিনভাবে করা যায়। এর জন্য আলাদা একটি `AiModule` এবং `AiService` থাকবে।

### ফিচার ১: AI ইভেন্ট ডেসক্রিপশন ও ট্যাগলাইন জেনারেটর
* **অ্যান্ডপয়েন্ট:** `POST /api/events/ai-generate`
* **কীভাবে কাজ করবে?**
  - অর্গানাইজার শুধু একটি ছোট ধারণা ইনপুট দেবে:
    ```json
    {
      "topic": "React 19 Server Components Workshop",
      "targetAudience": "Frontend Developers",
      "tone": "Professional & Exciting"
    }
    ```
  - `AiService` ব্যাকগ্রাউন্ডে **Google Gemini API** (বা OpenAI SDK) কল করবে।
  - AI প্রম্পটের মাধ্যমে একটি আকর্ষণীয় টাইটেল, পেশাদার ডেসক্রিপশন এবং কতগুলো সিট রাখা উচিত তার একটি স্মার্ট প্রপোজাল তৈরি করে ফ্রন্টএন্ডে পাঠাবে।
  - অর্গানাইজার এক ক্লিকে সেই ডেটা দিয়ে ইভেন্ট তৈরি করে ফেলতে পারবে!

### ফিচার ২: স্মার্ট ন্যাচারাল ল্যাঙ্গুয়েজ সার্চ (Semantic Search)
* সাধারণ সার্চে শুধুমাত্র অবিকল শব্দ মেলাতে হয়।
* AI Embeddings (যেমন: Gemini Embeddings) ব্যবহার করে ইউজার যদি সার্চ করে: `"I want to learn web design for beginners"`, তবে AI অর্থ বুঝে `TECH` বা `WORKSHOP` ক্যাটাগরির প্রাসঙ্গিক ইভেন্টগুলো খুঁজে বের করে আনবে।

---

## ৪. Evolution Step D: প্রোডাকশন রেডিনেস ও অপ্টিমাইজেশন

প্রজেক্টটি ডেপ্লয় করার আগে নিচের ৩টি বিষয় যুক্ত করতে হবে:

1. **Swagger / OpenAPI Documentation:**
   - `@nestjs/swagger` ইনস্টল করে কোড থেকেই স্বয়ংক্রিয়ভাবে ইন্টারঅ্যাক্টিভ API ডক্স (`http://localhost:3000/api/docs`) তৈরি করা।
2. **Rate Limiting (থ্রটলিং):**
   - `@nestjs/throttler` ব্যবহার করে স্প্যাম রিকোয়েস্ট ও ডস অ্যাটাক প্রতিরোধ করা (যেমন: প্রতি মিনিটে সর্বোচ্চ ২০টি বুকিং রিকোয়েস্ট)।
3. **Dockerization:**
   - একটি `Dockerfile` এবং `docker-compose.yml` তৈরি করে NestJS এবং PostgreSQL-কে এক ক্লিকে কন্টেইনারাইজ করা।

---

> [!NOTE]
> এই সম্পূর্ণ বিবর্তনটি তখনই অর্থবহ হবে যখন তোমার প্রথম ধাপ অর্থাৎ [EventPulse-Lite (In-Memory)](./03-step-by-step-building-roadmap.md) সম্পূর্ণ নিখুঁতভাবে তৈরি হবে। শুভ কোডিং!
