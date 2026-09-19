# 03. Step-by-Step Building Roadmap (ধাপে ধাপে তৈরি করার রোডম্যাপ)

এই গাইডে আমরা **EventPulse-Lite** প্রজেক্টটি শূন্য (Scratch) থেকে শুরু করে ধাপে ধাপে কীভাবে আর্কিটেক্ট করবে, তার সম্পূর্ণ গাইডলাইন এবং CLI কমান্ড আলোচনা করব।

এখানে মোট **৭টি ফেজ (Phases)** রয়েছে। প্রতিটি ফেজে নির্দিষ্ট লক্ষ্য, রান করার কমান্ড, কী কী ফাইল তৈরি করতে হবে, এবং কীভাবে Postman দিয়ে টেস্ট করবে তা সুনির্দিষ্টভাবে উল্লেখ করা আছে।

> [!IMPORTANT]
> **স্মরণীয় নিয়ম:** কোড কপি-পেস্ট করবে না। এই গাইডটি তোমাকে চিন্তার দিকনির্দেশনা এবং কমান্ড প্রদান করবে; লজিক ও কোড তোমাকে তোমার নিজস্ব চিন্তাশক্তি দিয়ে লিখতে হবে।

---

## Phase 0: নতুন প্রজেক্ট ইনিশিয়ালাইজ ও সেটআপ

প্রথমে একটি নতুন NestJS অ্যাপ্লিকেশন তৈরি করতে হবে এবং প্রয়োজনীয় ডিপেন্ডেন্সি ইনস্টল করতে হবে।

### ১. টার্মিনাল কমান্ডসমূহ:
```bash
# ১. নতুন NestJS প্রজেক্ট তৈরি করো (টার্মিনালে প্রম্পট আসলে npm সিলেক্ট করবে)
nest new eventpulse-lite

# ২. প্রজেক্ট ফোল্ডারে প্রবেশ করো
cd eventpulse-lite

# ৩. ভ্যালিডেশনের জন্য প্রয়োজনীয় লাইব্রেরি ইনস্টল করো
npm install class-validator class-transformer
```

### ২. `tsconfig.json` কনফিগারেশন চেক:
NestJS-এ `class-validator` যাতে সঠিকভাবে ফিল্ড টাইপ ডিটেক্ট করতে পারে, সেজন্য `tsconfig.json` ফাইলে `compilerOptions`-এর ভেতর এই লাইনটি নিশ্চিত করো:
```json
"useDefineForClassFields": false
```
*(যদি এটি না থাকে, তবে যোগ করে নাও। এটি না থাকলে DTO ডেকোরেটরস কাজ নাও করতে পারে।)*

### ৩. গ্লোবাল প্রিফিক্স (`/api`):
`src/main.ts` ফাইলে গিয়ে অ্যাপ শুরু হওয়ার আগে গ্লোবাল প্রিফিক্স সেট করো:
```typescript
app.setGlobalPrefix('api');
```
তাহলে সব রুটের আগে স্বয়ংক্রিয়ভাবে `/api/` বসে যাবে (যেমন: `http://localhost:3000/api/events`)।

---

## Phase 1: Feature Module এবং Controller স্ক্যাফোল্ড

NestJS CLI ব্যবহার করে ক্লিন আর্কিটেকচারে ফোল্ডার ও ফাইল তৈরি করতে হবে। অতিরিক্ত টেস্ট ফাইল যাতে না আসে সেজন্য `--no-spec` এবং সাবফোল্ডার এড়াতে `--flat` ব্যবহার করা ভালো অভ্যাস।

### টার্মিনাল কমান্ডসমূহ:
```bash
# ১. Events Module তৈরি করো
nest g mo events

# ২. Events Service তৈরি করো
nest g s events --no-spec --flat

# ৩. Events Controller তৈরি করো
nest g co events --no-spec --flat
```

> [!NOTE]
> লক্ষ্য করবে, Nest CLI স্বয়ংক্রিয়ভাবে `app.module.ts`-এ `EventsModule` রেজিস্টার করে দিয়েছে এবং `events.module.ts`-এ `EventsController` ও `EventsService` যুক্ত করেছে।

---

## Phase 2: Interface এবং In-Memory Seed Data

কোনো এন্ডপয়েন্ট বানানোর আগে ডেটার আকার (Shape) ঠিক করা দরকার।

### ১. Interface ফাইল তৈরি:
`src/events/interfaces/event.interface.ts` ফাইল তৈরি করো।

**এই ফাইলে কী থাকবে?**
* `EventCategory` Enum: `TECH`, `BUSINESS`, `WORKSHOP`, `MUSIC`।
* `EventStatus` Enum: `UPCOMING`, `COMPLETED`, `CANCELLED`।
* `Event` Interface:
  - `id`: number
  - `title`: string
  - `description`: string
  - `category`: EventCategory
  - `totalSeats`: number
  - `bookedSeats`: number
  - `status`: EventStatus
  - `createdAt`: Date

### ২. Service-এ Initial State ও সিড ডেটা রাখা:
`src/events/events.service.ts` ফাইলে যাও:
* একটি `private events: Event[] = [...]` ডিফাইন করো।
* সেখানে ২–৩টি ডামি ইভেন্ট সিড ডেটা হিসেবে রাখো যাতে শুরুতেই আমরা ব্রাউজার বা Postman-এ ডেটা দেখতে পাই।

---

## Phase 3: Read Endpoints (`GET /api/events` & `GET /api/events/:id`)

এখন আমরা রিড অপারেশন ইমপ্লিমেন্ট করব।

### ১. কন্ট্রোলার ও সার্ভিস প্ল্যান:
* **All Events:** `GET /api/events`
  - কন্ট্রোলার `eventsService.findAll()` মেথড কল করবে।
* **Single Event:** `GET /api/events/:id`
  - URL থেকে আসা `:id` স্ট্রিং আকারে আসে। তাই এখানে **`ParseIntPipe`** ব্যবহার করবে:
    `@Param('id', ParseIntPipe) id: number`
  - সার্ভিস `events.find(e => e.id === id)` করবে।
  - **ইঞ্জিনিয়ারিং মানসিকতা:** যদি আইডি দিয়ে কোনো ইভেন্ট না পাওয়া যায়, তবে সরাসরি NestJS-এর বিল্ট-ইন `NotFoundException('Event not found')` থ্রো করতে হবে। (কখনোই `null` রিটার্ন করবে না!)

### ২. Postman ভেরিফিকেশন:
* `GET http://localhost:3000/api/events` -> `200 OK` (সব ইভেন্টের তালিকা)।
* `GET http://localhost:3000/api/events/1` -> `200 OK` (১ নম্বর ইভেন্ট)।
* `GET http://localhost:3000/api/events/999` -> `404 Not Found` (সঠিক এরর মেসেজসহ)।
* `GET http://localhost:3000/api/events/abc` -> `400 Bad Request` (ParseIntPipe স্বয়ংক্রিয়ভাবে স্ট্রিং আটকে দেবে)।

---

## Phase 4: Create Event (`POST /api/events`) with DTO & Global Validation

নতুন ইভেন্ট তৈরির জন্য একটি সুনির্দিষ্ট DTO (Data Transfer Object) দরকার।

### ১. Create DTO তৈরি:
`src/events/dto/create-event.dto.ts` ফাইল তৈরি করো।
* ফিল্ডস এবং ভ্যালিডেশন ডেকোরেটরস:
  - `title`: `@IsNotEmpty()`, `@IsString()`
  - `description`: `@IsNotEmpty()`, `@IsString()`
  - `category`: `@IsEnum(EventCategory, { message: 'Invalid category' })`
  - `totalSeats`: `@IsInt()`, `@Min(1)`
* **মনোযোগ দাও:** `bookedSeats` বা `status` কিন্তু DTO-তে থাকবে না! কারণ নতুন ইভেন্ট তৈরির সময় `bookedSeats` সবসময় ডিফল্ট `0` এবং `status` সবসময় `UPCOMING` থাকবে। এটি সার্ভিস নিজে সেট করবে।

### ২. Global ValidationPipe চালু করা:
`src/main.ts`-এ গিয়ে গ্লোবাল পাইপ সক্রিয় করো:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // DTO-তে যা ডিফাইন করা নেই তা ফেলে দেবে
    forbidNonWhitelisted: true,  // কোনো অতিরিক্ত প্রোপার্টি পাঠালে সাথে সাথে 400 এরর মারবে
    transform: true,              // পেলোডকে DTO ক্লাসের ইনস্ট্যান্সে কনভার্ট করবে
  }),
);
```

### ৩. সার্ভিস লজিক:
* নতুন একটি ইভেন্ট অবজেক্ট বানিয়ে `this.events.push(newEvent)` করবে।
* নতুন ইভেন্টটি রিটার্ন করবে।

### ৪. Postman ভেরিফিকেশন:
* `POST http://localhost:3000/api/events`
  ```json
  {
    "title": "NestJS Deep Dive",
    "description": "Mastering backend architecture",
    "category": "TECH",
    "totalSeats": 50
  }
  ```
  -> `201 Created`
* কোনো উল্টাপাল্টা ফিল্ড পাঠিয়ে টেস্ট করো (যেমন: `"hacker": true` বা `"totalSeats": -5`) -> `400 Bad Request` আসতে হবে।

---

## Phase 5: Query Filtering (`category` ও `status` ফিল্টার)

আমরা চাই ইউজার যেন ক্যাটাগরি বা স্ট্যাটাস দিয়ে ইভেন্ট ফিল্টার করতে পারে:
`GET /api/events?category=TECH&status=UPCOMING`

### ১. Filter Query DTO তৈরি:
`src/events/dto/filter-events-query.dto.ts` ফাইল তৈরি করো:
* `category?: EventCategory`: `@IsOptional()`, `@IsEnum(EventCategory)`
* `status?: EventStatus`: `@IsOptional()`, `@IsEnum(EventStatus)`

### ২. কন্ট্রোলার ও সার্ভিস আপডেট:
* কন্ট্রোলারে: `@Get() findAll(@Query() query: FilterEventsQueryDto)`
* সার্ভিসে: `findAll(query?: FilterEventsQueryDto)` মেথডে লজিক:
  - যদি `query.category` থাকে, তবে অ্যারেকে ক্যাটাগরি দিয়ে ফিল্টার করো।
  - যদি `query.status` থাকে, তবে স্ট্যাটাস দিয়ে ফিল্টার করো।
  - কোনো কুয়েরি না থাকলে সম্পূর্ণ অ্যারে রিটার্ন করো।

### ৩. Postman ভেরিফিকেশন:
* `GET http://localhost:3000/api/events?category=TECH`
* `GET http://localhost:3000/api/events?category=INVALID_CAT` -> `400 Bad Request`

---

## Phase 6: Update & Domain Actions (`PATCH`)

এখানে ৩টি ভিন্ন ভিন্ন PATCH অ্যান্ডপয়েন্ট থাকবে:

### ১. General Update: `PATCH /api/events/:id`
* `src/events/dto/update-event.dto.ts` তৈরি করো (NestJS `@nestjs/mapped-types`-এর `PartialType(CreateEventDto)` ব্যবহার করতে পারো)।
* শুধুমাত্র `title`, `description`, `category` আপডেট করা যাবে।

### ২. Seat Booking Action: `PATCH /api/events/:id/book`
* কোনো বডি লাগবে না, শুধু আইডি পাঠাবে।
* **সার্ভিস লজিক ও রুলস:**
  1. ইভেন্ট না পেলে -> `NotFoundException(404)`.
  2. ইভেন্ট স্ট্যাটাস `CANCELLED` বা `COMPLETED` হলে -> `BadRequestException(400)`.
  3. যদি `bookedSeats >= totalSeats` হয় (সিট খালি নেই) -> `BadRequestException(400)`.
  4. শর্ত পূরণ হলে: `bookedSeats` ১ বাড়াও এবং আপডেট করা ইভেন্ট রিটার্ন করো।

### ৩. Event Cancellation Action: `PATCH /api/events/:id/cancel`
* **সার্ভিস লজিক ও রুলস:**
  1. ইভেন্ট না পেলে -> `NotFoundException(404)`.
  2. ইভেন্ট ইতিমধ্যে `CANCELLED` হলে -> `BadRequestException(400)`.
  3. স্ট্যাটাস পরিবর্তন করে `CANCELLED` করো।

---

## Phase 7: Middleware, Guard & Interceptor

এটি তোমার প্রজেক্টকে প্রফেশনাল এন্টারপ্রাইজ গ্রেড বানাবে।

### ১. Logger Middleware:
* `nest g mi common/middleware/request-logger --no-spec --flat`
* এটি `NestMiddleware` ইমপ্লিমেন্ট করবে।
* প্রতিটি রিকোয়েস্টে কনসোলে প্রিন্ট করবে: `[TIMESTAMP] [METHOD] [URL]`.
* `src/app.module.ts`-এ `NestModule` ইমপ্লিমেন্ট করে `configure()` মেথডে সব রুটের জন্য মিডলওয়্যারটি কনফিগার করো।

### ২. Admin Guard:
* `nest g gu common/guards/admin --no-spec --flat`
* এটি `CanActivate` ইমপ্লিমেন্ট করবে।
* `context.switchToHttp().getRequest()` থেকে রিকোয়েস্টের হেডার চেক করবে।
* যদি `request.headers['x-admin-key'] === 'organizer-secret-key'` হয়, তবে `return true;`, অন্যথায় `return false;` (বা `ForbiddenException(403)` থ্রো করো)।
* এই গার্ডটি `PATCH /api/events/:id/cancel` অ্যান্ডপয়েন্টের ওপর `@UseGuards(AdminGuard)` হিসেবে বসাও।

### ৩. Response Interceptor:
* `nest g itc common/interceptors/response --no-spec --flat`
* এটি `NestInterceptor` ইমপ্লিমেন্ট করবে।
* RxJS-এর `map` অপারেটর ব্যবহার করে সফল রেসপন্সগুলোকে একটি স্ট্যান্ডার্ড ফরম্যাটে র‍্যাপ করবে:
  ```json
  {
    "success": true,
    "timestamp": "2026-09-19T...",
    "data": { ... }
  }
  ```
* `src/main.ts`-এ `app.useGlobalInterceptors(new ResponseInterceptor())` হিসেবে যুক্ত করো।

---

> [!TIP]
> **পরবর্তী নির্দেশিকা:**
> ডেভেলপমেন্টের সময় কিছু সূক্ষ্ম ত্রুটি এবং কর্নার কেস দেখা দিতে পারে। সেগুলো আগেভাগে জানতে [04-challenges-and-edge-cases.md](./04-challenges-and-edge-cases.md) পড়ে নাও।
