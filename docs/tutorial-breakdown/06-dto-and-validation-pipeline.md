# ০৬. DTO ও ভ্যালিডেশন পাইপলাইন: রানটাইম নিরাপত্তা ও ডাটা কন্ট্রাক্ট

এই অধ্যায়ে আমরা শিখবো কীভাবে নতুন টিকিট তৈরির এন্ডপয়েন্ট ডিজাইন করতে হয়, ক্লায়েন্টকে অযাচিত ডেটা পাঠানো থেকে আটকাতে হয় এবং `class-validator` ও `ValidationPipe` দিয়ে শতভাগ নিরাপদ API কন্ট্রাক্ট তৈরি করতে হয়।

---

## ১. টিকিট তৈরির এন্ডপয়েন্ট ও ডেটা কন্ট্রোল ফিলোসফি

আমাদের নতুন রুট: `POST /api/tickets`।

### ফিল্ডগুলোর মালিকানা (Ownership):
- **সার্ভারের নিয়ন্ত্রণে থাকবে (Server Controlled):** `id` (অটো-ইনক্রিমেন্ট), `status` (ডিফল্টভাবে সবসময় `OPEN`), `createdAt` (`new Date().toISOString()`)।
- **ক্লায়েন্ট পাঠাতে পারবে (Client Controlled):** শুধুমাত্র `subject`, `description` এবং `priority`।

ক্লায়েন্ট যদি নিজেই `id: 99` বা `status: 'CLOSED'` পাঠিয়ে দেয়, সার্ভার তা কখনোই গ্রহণ করবে না।

---

## ২. কেন Interface নয়, DTO-তে Class ব্যবহার করতে হবে?

TypeScript `interface` কম্পাইল হওয়ার পর মুছে যায় (Type Erasure)। রানটাইমে এর কোনো অস্তিত্ব থাকে না।

কিন্তু `class` জাভাস্ক্রিপ্ট রানটাইমে অবজেক্ট হিসেবে টিকে থাকে। তাই ডেকোরেটর (`@IsNotEmpty()`, `@IsIn()`) দিয়ে রানটাইমে ফিল্ড ভ্যালিডেট করতে হলে অবশ্যই **`class`** ব্যবহার করতে হবে।

---

## ৩. প্যাকেজ ইনস্টলেশন ও `CreateTicketDto` তৈরি

টার্মিনালে প্যাকেজ দুটি ইনস্টল করা:
```bash
npm install class-validator class-transformer
```

DTO ক্লাস তৈরি করা:
```bash
nest g class tickets/dto/create-ticket.dto --no-spec --flat
```

### DTO কোড ও ভ্যালিডেশন রুলস:
```typescript
// src/tickets/dto/create-ticket.dto.ts
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'Subject খালি রাখা যাবে না।' })
  @IsString()
  subject: string;

  @IsNotEmpty({ message: 'Description দেওয়া আবশ্যক।' })
  @IsString()
  description: string;

  @IsIn(['LOW', 'MEDIUM', 'HIGH'], { message: 'Priority অবশ্যই LOW, MEDIUM অথবা HIGH হতে হবে।' })
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

---

## ৪. `ValidationPipe` সেটআপ ও নিরাপত্তার দুই স্তর

শুধুমাত্র DTO ক্লাসে ডেকোরেটর বসালেই কাজ হবে না। এই রুলসগুলোকে প্রতিটি রিকোয়েস্টে কার্যকর করতে [src/main.ts](../../src/main.ts)-এ গ্লোবাল পাইপ যুক্ত করতে হবে:

```typescript
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,            // DTO-তে সংজ্ঞায়িত নেই এমন ফিল্ডগুলো ফিল্টার করে
    forbidNonWhitelisted: true, // কোনো অতিরিক্ত ফিল্ড থাকলে রিকোয়েস্ট সরাসরি বাতিল (400) করে
  }),
);
```

### 💡 ইঞ্জিনিয়ারিং ভাবনা: `whitelist` বনাম `forbidNonWhitelisted`
- **`whitelist: true`:** ক্লায়েন্ট যদি বাড়তি কোনো ফিল্ড পাঠায় (যেমন `{ subject: "...", hacker: true }`), নেস্ট সাইলেন্টলি `hacker` ফিল্ডটি বাদ দিয়ে বাকিটুকু প্রসেস করবে।
- **`forbidNonWhitelisted: true`:** আমরা ক্লায়েন্টের ভুলকে সাইলেন্টলি ইগনোর না করে সরাসরি **`400 Bad Request`** ছুঁড়ে দেবো: `"property hacker should not exist"`।
  - এর সুবিধা: ক্লায়েন্ট বা ফ্রন্টএন্ড ডেভেলপার ভুল ডেটা পাঠালে সাথে সাথে বুঝতে পারবে যে API এটি সমর্থন করে না।

---

## ৫. দ্য ব্যানানা প্রবলেমের নিখুঁত সমাধান (`FilterTicketsQueryDto`)

পূর্বের অধ্যায়ে আমরা দেখেছিলাম `GET /api/tickets?status=banana` দিলে কোনো এরর না এসে খালি অ্যারে আসছিল। এবার আমরা কোয়েরি প্যারামিটারের জন্যও একটি DTO তৈরি করবো:

```bash
nest g class tickets/dto/filter-tickets-query.dto --no-spec --flat
```

### কোড:
```typescript
// src/tickets/dto/filter-tickets-query.dto.ts
import { IsOptional, IsIn } from 'class-validator';

export class FilterTicketsQueryDto {
  @IsOptional()
  @IsIn(['OPEN', 'CLOSED'], { message: 'Status অবশ্যই OPEN অথবা CLOSED হতে হবে।' })
  status?: 'OPEN' | 'CLOSED';

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'], { message: 'Priority অবশ্যই LOW, MEDIUM অথবা HIGH হতে হবে।' })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

### কন্ট্রোলারে কোয়েরি অবজেক্ট ইনজেক্ট করা:
```typescript
// src/tickets/tickets.controller.ts
@Get()
findAll(@Query() filters: FilterTicketsQueryDto) {
  return this.ticketsService.findAll(filters.status, filters.priority);
}
```

### এখন টেস্ট করে দেখুন:
- `GET /api/tickets?status=banana`
- **ফলাফল:** সাথে সাথে `400 Bad Request`!
```json
{
  "message": ["Status অবশ্যই OPEN অথবা CLOSED হতে হবে।"],
  "error": "Bad Request",
  "statusCode": 400
}
```

এখন ইনকামিং রিকোয়েস্ট বডি (`@Body`) হোক বা কোয়েরি স্ট্রিং (`@Query`)—সবকিছুই একটি শক্তিশালী ভ্যালিডেশন পাইপলাইনের মধ্য দিয়ে রানটাইমে শতভাগ নিরাপদে প্রবেশ করছে।

---
⬅️ [পূর্ববর্তী অধ্যায়: ০৫. এক্সেপশন ও কোয়েরি ফিল্টারিং](./05-exceptions-and-query-filtering.md) | ➡️ [পরবর্তী অধ্যায়: ০৭. ইনফ্রাস্ট্রাকচার ও পাবলিক ডেপ্লয়মেন্ট](./07-infrastructure-and-deployment.md)
