# DTO (Data Transfer Object), Validation ও Transformation - সম্পূর্ণ বাংলা গাইড

এই গাইডটি একদম নতুনদের জন্য তৈরি, যারা DTO, `class-validator` বা `class-transformer` সম্পর্কে কিছুই জানেন না। এখানে বাস্তব জীবনের উদাহরণসহ ধাপে ধাপে সহজ বাংলায় সবকিছু ব্যাখ্যা করা হয়েছে।

---

## 📑 সূচিপত্র
1. [DTO কী? (What is DTO?)](#১-dto-কী-what-is-dto)
2. [বাস্তব জীবনের উদাহরণ (Real-Life Analogy)](#২-বাস্তব-জীবনের-উদাহরণ-real-life-analogy)
3. [DTO কেন দরকার? (Why do we need DTO?)](#৩-dto-কেন-দরকার-why-do-we-need-dto)
4. [Interface বনাম Class: কেন DTO-তে Class ব্যবহার করা হয়?](#৪-interface-বনাম-class-কেন-dto-তে-class-ব্যবহার-করা-হয়)
5. [class-validator এবং class-transformer কী ও কেন প্রয়োজন?](#৫-class-validator-এবং-class-transformer-কী-ও-কেন-প্রয়োজন)
6. [কখন এবং কীভাবে DTO ব্যবহার করবেন? (Step-by-Step Hands-On)](#৬-কখন-এবং-কীভাবে-dto-ব্যবহার-করবেন-step-by-step-hands-on)
7. [ValidationPipe-এর যাদু (Global Pipe Setup)](#৭-validationpipe-এর-যাদু-global-pipe-setup)
8. [সারসংক্ষেপ (Quick Summary)](#৮-সারসংক্ষেপ-quick-summary)

---

## ১. DTO কী? (What is DTO?)

**DTO**-এর পূর্ণরূপ হলো **Data Transfer Object** (ডেটা ট্রান্সফার অবজেক্ট)।

সহজ কথায়:
> যখন ক্লায়েন্ট (যেমন: React, Vue, মোবাইল অ্যাপ বা Postman) থেকে সার্ভারের (Backend) কাছে কোনো ডেটা পাঠানো হয়, তখন সেই ডেটার **গঠন বা নকশা কেমন হবে** তা সংজ্ঞায়িত করার মাধ্যমই হলো DTO।

যেমন: একজন ইউজার যখন নতুন একটি হেল্পডেস্ক টিকিট তৈরি করবে, তখন সে কী কী পাঠাতে পারবে?
- টিকিটের টাইটেল (`title`)
- টিকিটের বর্ণনা (`description`)
- অগ্রাধিকার বা প্রায়োরিটি (`priority`)

এই নিয়ম বা ব্লু-প্রিন্ট নির্ধারণ করার জন্যই আমরা একটি DTO ফাইল তৈরি করি।

---

## ২. বাস্তব জীবনের উদাহরণ (Real-Life Analogy)

ধরে নিন আপনি ব্যাংকে গিয়ে একটি **অ্যাকাউন্ট খোলার ফর্ম** পূরণ করছেন:

1. **DTO হলো সেই ফাঁকা ফর্মটি:**
   ফর্মে নির্দিষ্ট কিছু ঘর আছে: "নাম", "ফোন নম্বর", "ইমেইল", "জাতীয় পরিচয়পত্র নম্বর"। ফর্মের বাইরে আপনি নিজের ইচ্ছামতো উল্টাপাল্টা তথ্য লিখে দিতে পারবেন না।
   
2. **class-validator হলো ব্যাংকের অফিসার (Verification Officer):**
   অফিসার দেখে নিচ্ছেন আপনি ফোন নম্বরের ঘরে অক্ষর লিখেছেন কি না, ইমেইলে `@` চিহ্ন আছে কি না, বা কোনো প্রয়োজনীয় ঘর ফাঁকা রেখেছেন কি না। ভুল থাকলে অফিসার সঙ্গে সঙ্গে ফর্ম ফিরিয়ে দেবেন।

3. **class-transformer হলো ব্যাংকের ডাটা এন্ট্রি অপারেটর:**
   আপনি ফর্মে জন্মতারিখ লিখে দিয়েছেন টেক্সট আকারে (যেমন `"1995-10-25"`), অপারেটর সফটওয়্যারে সেটিকে আসল `Date` ফরম্যাটে রূপান্তর করে ডাটাবেজে সংরক্ষণ করছেন।

---

## ৩. DTO কেন দরকার? (Why do we need DTO?)

DTO ছাড়া সরাসরি কোড লিখলে কী কী সমস্যা হয়?

### ১) নিরাপত্তা ঝুঁকি (Mass Assignment Vulnerability)
ধরে নিন আপনার একটি ইউজার রেজিস্ট্রেশন API আছে। আপনি শুধু আশা করছেন ইউজার `name` এবং `password` পাঠাবে। কিন্তু একজন চালাক হ্যাকার রিকোয়েস্টের সাথে পাঠিয়ে দিলো:
```json
{
  "name": "hacker",
  "password": "123",
  "isAdmin": true
}
```
যদি DTO না থাকে এবং আপনি সরাসরি পুরো রিকোয়েস্ট বডি ডাটাবেজে সেভ করে দেন, তবে হ্যাকার নিজে নিজেই এডমিন হয়ে যাবে! DTO ব্যবহার করলে সার্ভার শুধু অনুমোদিত ফিল্ডগুলোই গ্রহণ করবে।

### ২) কোডের টাইপ সেফটি ও স্বাচ্ছন্দ্য (TypeScript Type Safety)
কন্ট্রোলার বা সার্ভিসের ভেতর কোড লেখার সময় আপনি ঠিকঠাক অটো-কমপ্লিশন (IntelliSense) পাবেন। কোন ফিল্ডটি স্ট্রিং আর কোনটি নাম্বার—তা আগেই নিশ্চিত হওয়া যায়।

### ৩) পরিষ্কার ডকুমেন্টেশন (Clear API Contract)
ফ্রন্টএন্ড ডেভেলপার আপনার DTO দেখলেই সাথে সাথে বুঝতে পারবে এই API কল করতে তাকে কোন কোন ফিল্ড পাঠাতে হবে।

---

## ৪. Interface বনাম Class: কেন DTO-তে Class ব্যবহার করা হয়?

TypeScript-এ আমরা টাইপ ডিফাইন করার জন্য `interface` বা `class` দুটিই ব্যবহার করতে পারি। কিন্তু NestJS-এ DTO লেখার জন্য সবসময় **`class`** ব্যবহার করা হয়। কেন?

| বিষয় | TypeScript `interface` | TypeScript `class` |
| :--- | :--- | :--- |
| **কম্পাইল হওয়ার পর** | জাভাস্ক্রিপ্টে পুরোপুরি মুছে যায় (Type Erasure) | জাভাস্ক্রিপ্ট কোডে অবজেক্ট হিসেবে অক্ষত থাকে |
| **রানটাইম মেটাডাটা** | রানটাইমে এর কোনো অস্তিত্ব থাকে না | রানটাইমে এর অস্তিত্ব এবং ডেকোরেটর মেটাডাটা থাকে |
| **ভ্যালিডেশন সাপোর্ট** | রানটাইমে কোনো ভ্যালিডেশন করা যায় না | ডেকোরেটর (`@IsString()` ইত্যাদি) দিয়ে রানটাইমে ডেটা যাচাই করা যায় |

> **মনে রাখুন:** ক্লায়েন্ট যখন রিকোয়েস্ট পাঠায়, তখন আপনার অ্যাপ্লিকেশনে কিন্তু টাইপস্ক্রিপ্ট থাকে না—সেটি জাভাস্ক্রিপ্ট হিসেবে রান করে। তাই রানটাইমে ডেটা চেক করার জন্য `class` থাকা বাধ্যতামূলক।

---

## ৫. class-validator এবং class-transformer কী ও কেন প্রয়োজন?

### ১) `class-validator`
এটি একটি বহুল জনপ্রিয় লাইব্রেরি যা ডেকোরেটরের মাধ্যমে ক্লাসের প্রোপার্টির উপর ভ্যালিডেশন রুলস বসাতে দেয়।

**উদাহরণ:**
- `@IsNotEmpty()` — ফিল্ডটি ফাঁকা থাকা যাবে না।
- `@IsString()` — অবশ্যই স্ট্রিং বা টেক্সট হতে হবে।
- `@IsInt()` — অবশ্যই পূর্ণসংখ্যা হতে হবে।
- `@MinLength(5)` — কমপক্ষে ৫ অক্ষরের হতে হবে।
- `@IsEmail()` — সঠিক ইমেইল ফরম্যাট হতে হবে।
- `@IsEnum(...)` — নির্দিষ্ট কিছু অপশনের মধ্যে একটি হতে হবে।

### ২) `class-transformer`
ক্লায়েন্ট যখন নেটওয়ার্কের মাধ্যমে ডেটা পাঠায়, তখন সেটি প্লেইন টেক্সট বা সাধারণ JSON অবজেক্ট আকারে আসে।
- সাধারণ JSON কিন্তু কোনো ক্লাসের ইনস্ট্যান্স নয়।
- `class-transformer` সেই সাধারণ JSON অবজেক্টকে আমাদের DTO ক্লাসের আসল ইনস্ট্যান্সে কনভার্ট করে।
- এছাড়াও স্ট্রিং মানকে নাম্বারে বা বোলেয়ানে রূপান্তর করতে (যেমন: URL কুয়েরি প্যারামিটার `"123"` কে আসল নাম্বার `123` বানাতে) এটি কাজ করে।

---

## ৬. কখন এবং কীভাবে DTO ব্যবহার করবেন? (Step-by-Step Hands-On)

চলুন আমাদের হেল্পডেস্ক অ্যাপ্লিকেশনে নতুন টিকিট তৈরির একটি DTO তৈরি করে দেখি:

### ধাপ ১: প্রয়োজনীয় প্যাকেজ ইনস্টল করা
```bash
npm install class-validator class-transformer
```

### ধাপ ২: DTO ফাইল তৈরি করা
সাধারণত [src/tickets/dto/create-ticket.dto.ts](../src/tickets/dto/create-ticket.dto.ts) ফাইলে রাখা হয়:

```typescript
// src/tickets/dto/create-ticket.dto.ts
import { IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateTicketDto {
  @IsNotEmpty({ message: 'Title ফাঁকা রাখা যাবে না।' })
  @IsString({ message: 'Title অবশ্যই টেক্সট হতে হবে।' })
  @MinLength(5, { message: 'Title কমপক্ষে ৫ অক্ষরের হতে হবে।' })
  title: string;

  @IsNotEmpty({ message: 'Description দেওয়া বাধ্যতামূলক।' })
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(TicketPriority, { message: 'Priority অবশ্যই LOW, MEDIUM অথবা HIGH হতে হবে।' })
  priority?: TicketPriority;
}
```

### ধাপ ৩: কন্ট্রোলারে DTO ব্যবহার করা
[src/tickets/tickets.controller.ts](../src/tickets/tickets.controller.ts) কন্ট্রোলারে `@Body()` ডেকোরেটরের সাথে DTO ক্লাসটি যুক্ত করে দিন:

```typescript
// src/tickets/tickets.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { TicketsService } from './tickets.service.js';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    // এখানে createTicketDto পুরোপুরি ভ্যালিডেটেড এবং নিরাপদ!
    return this.ticketsService.create(createTicketDto);
  }
}
```

---

## ৭. ValidationPipe-এর যাদু (Global Pipe Setup)

DTO এবং ডেকোরেটর লেখার পর সেগুলোকে স্বয়ংক্রিয়ভাবে কার্যকর করতে NestJS-কে বলে দিতে হয়। এর জন্য [src/main.ts](../src/main.ts)-এ একটি গ্লোবাল পাইপ যোগ করতে হয়:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // গ্লোবাল ভ্যালিডেশন পাইপ চালু করা
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO-তে ডিফাইন করা নেই এমন কোনো এক্সট্রা ফিল্ড আসলে তা স্বয়ংক্রিয়ভাবে মুছে ফেলবে
      forbidNonWhitelisted: true, // কোনো অতিরিক্ত ফিল্ড পাঠালে রিকোয়েস্ট সরাসরি রিজেক্ট (400 Bad Request) করে দেবে
      transform: true, // ইনকামিং প্লেইন অবজেক্টকে আসল DTO ক্লাসের অবজেক্টে রূপান্তর করবে
    }),
  );

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

### এখন যদি ক্লায়েন্ট ভুল ডেটা পাঠায়:
ধরুন কোনো ইউজার এমন ডেটা পাঠালো:
```json
{
  "title": "Hi",
  "priority": "SUPER_URGENT"
}
```

NestJS কোনো কন্ট্রোলারে না ঢুকেই সাথে সাথে এই সুন্দর স্বয়ংক্রিয় ত্রুটি রেসপন্স দেবে (HTTP 400 Bad Request):
```json
{
  "message": [
    "Title কমপক্ষে ৫ অক্ষরের হতে হবে।",
    "Description দেওয়া বাধ্যতামূলক।",
    "Priority অবশ্যই LOW, MEDIUM অথবা HIGH হতে হবে।"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
আপনাকে কন্ট্রোলারে গিয়ে একটি লাইনও `if/else` লিখে চেক করতে হয়নি!

---

## ৮. সারসংক্ষেপ (Quick Summary)

1. **DTO:** ইনকামিং বা আউটগোয়িং ডেটার নকশা বা চুক্তিপত্র।
2. **কেন দরকার:** নিরাপত্তা নিশ্চিত করতে, অনাকাঙ্ক্ষিত ফিল্ড ব্লক করতে এবং টাইপ সেফটি বজায় রাখতে।
3. **Class কেন:** কারণ ইন্টারফেস রানটাইমে মুছে যায়, কিন্তু ক্লাস রানটাইমে টিকে থাকে।
4. **class-validator:** ডেটা সঠিক কি না তা পরীক্ষা করার গার্ড।
5. **class-transformer:** সাধারণ কাঁচা JSON-কে ক্লাসের অবজেক্টে রূপান্তর করার কারিগর।
6. **ValidationPipe:** পুরো প্রক্রিয়াটি স্বয়ংক্রিয়ভাবে রিকোয়েস্টের শুরুতে কার্যকর করার মাধ্যম।
