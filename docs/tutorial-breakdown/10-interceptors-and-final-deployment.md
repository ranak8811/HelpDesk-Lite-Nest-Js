# ১০. ইন্টারসেপ্টর ও ফাইনাল রি-ডেপ্লয়মেন্ট: কনসিস্টেন্ট রেসপন্স ও লাইভ এপিআই

এই শেষ অধ্যায়ে আমরা শিখবো কীভাবে কন্ট্রোলারে কোনো কোড পরিবর্তন না করে পুরো অ্যাপ্লিকেশনের রেসপন্সকে একটি সুনির্দিষ্ট স্ট্যান্ডার্ড কাঠামোর মধ্যে বাঁধতে হয়, এবং সম্পূর্ণ প্রজেক্টকে প্রোডাকশনে রি-ডেপ্লয় করে লাইভ টেস্ট করতে হয়।

---

## ১. রেসপন্সের অসামঞ্জস্যতা ও ইন্টারসেপ্টরের প্রয়োজনীয়তা

আমাদের বর্তমান কন্ট্রোলারের রেসপন্সগুলো দেখা যাক:
- `GET /api/tickets` পাঠালে রিটার্ন করে: `[...]` (একটি সাধারণ অ্যারে)
- `GET /api/tickets/1` পাঠালে রিটার্ন করে: `{...}` (একটি সাধারণ অবজেক্ট)

যদিও এটি কাজ করে, কিন্তু প্রফেশনাল টিমগুলোতে ফ্রন্টএন্ড বা মোবাইল ডেভেলপাররা আশা করেন প্রতিটি সফল রেসপন্স যেন দেখতে একই রকম হয়:
```json
{
  "success": true,
  "data": ...
}
```

### খারাপ উপায়:
কন্ট্রোলারের প্রতিটি মেথডে গিয়ে `{ success: true, data: result }` লেখা। এটি কোড নষ্ট করে এবং ভবিষ্যতে নতুন মেথড যোগ করলে বারবার একই কোড লিখতে হয়।

### ✅ ইঞ্জিনিয়ারিং উপায়:
**Interceptor** ব্যবহার করা। ইন্টারসেপ্টর কন্ট্রোলার থেকে বের হয়ে যাওয়া রেসপন্সকে মাঝপথে আটকে দিয়ে একটি কমন খামে মুড়ে দেয়।

---

## ২. গ্লোবাল `ResponseInterceptor` তৈরি

টার্মিনালে কমান্ড:
```bash
nest g interceptor common/response --no-spec --flat
```

### ইন্টারসেপ্টরের কোড:
```typescript
// src/common/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    // next.handle() কন্ট্রোলারের মেথড চালায় এবং রেজাল্ট Observable হিসেবে নিয়ে আসে
    return next.handle().pipe(
      map(data => ({
        success: true,
        data: data, // কন্ট্রোলার যা রিটার্ন করেছিল
      })),
    );
  }
}
```

### গ্লোবালি রেজিস্টার করা:
[src/main.ts](../../src/main.ts)-এ:
```typescript
// src/main.ts
app.useGlobalInterceptors(new ResponseInterceptor());
```

### এখন পোস্টম্যানে দেখুন:
`GET http://localhost:3000/api/tickets`
```json
{
  "success": true,
  "data": [
    { "id": 1, "subject": "Cannot login", "status": "OPEN" ... },
    { "id": 2, "subject": "Payment failed", "status": "OPEN" ... }
  ]
}
```
একটি মেথডেও হাত না দিয়ে পুরো অ্যাপ্লিকেশনের রেসপন্স ফরম্যাট কনসিস্টেন্ট হয়ে গেল!

---

## ৩. দ্য এরর বাউন্ডারি: কেন এরর রেসপন্স র‍্যাপ হয় না?

পোস্টম্যানে টেস্ট করে দেখুন:
`GET http://localhost:3000/api/tickets/999`

### রেসপন্স:
```json
{
  "message": "Ticket with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```
**লক্ষ্য করুন:** এরর রেসপন্সের বাইরে কিন্তু কোনো `{ success: true, ... }` বসেনি!

### কেন এটি অত্যন্ত গুরুত্বপূর্ণ?
সফটওয়্যার আর্কিটেকচারে এরর রেসপন্সকে `success: true`-এর মধ্যে ঢুকিয়ে দেওয়া একটি মারাত্মক ব্যাড প্র্যাকটিস। 
- ইন্টারসেপ্টরের `map()` শুধুমাত্র তখনই চলে যখন কন্ট্রোলার সফলভাবে ডেটা রিটার্ন করে।
- যখনই কোনো এক্সেপশন (`NotFoundException`, `ForbiddenException`) ঘটে, তখন এক্সিকিউশন ফ্লো ইন্টারসেপ্টরকে পাশ কাটিয়ে সরাসরি NestJS-এর **Exception Filter**-এ চলে যায়। ফলে ক্লায়েন্ট সঠিক ও বিভ্রান্তিমুক্ত এরর পায়।

---

## ৪. ফাইনাল রি-ডেপ্লয়মেন্ট ও লাইভ ভেরিফিকেশন

আমরা লোকালে অনেকগুলো নতুন ফিচার যোগ করেছি:
- `PATCH /api/tickets/:id` (আপডেট)
- ক্লোজড টিকিট আপডেট বন্ধের বিজনেস রুল
- `PATCH /api/tickets/:id/close` (ডোমেন অ্যাকশন)
- `RequestLoggerMiddleware`
- `StaffGuard`
- `ResponseInterceptor`

এখন গিটহাবে পুশ করে ক্লাউড সার্ভারে (Hostinger/Cloud) রি-ডেপ্লয় সম্পন্ন করার পর লাইভ ডোমেনে শেষবারের মতো টেস্ট করা হয়:

### লাইভ টেস্ট চেকলিস্ট:
1. **সাকসেস পাথ:**
   `GET https://your-domain/api/tickets` 
   ➡️ `{ success: true, data: [...] }` (Status: `200 OK`)
2. **ভ্যালিডেশন পাথ:**
   `POST https://your-domain/api/tickets` (উইথ ইনভ্যালিড প্রায়োরিটি) 
   ➡️ `400 Bad Request`
3. **সিকিউরিটি পাথ:**
   `PATCH https://your-domain/api/tickets/1/close` (হেডার ছাড়া) 
   ➡️ `403 Forbidden`
4. **অথরাইজড অ্যাকশন:**
   `PATCH https://your-domain/api/tickets/1/close` (`x-staff-key: helpdesk-staff-secret` সহ) 
   ➡️ `200 OK` (টিকিট ক্লোজড!)
5. **বিজনেস রুল পাথ:**
   `PATCH https://your-domain/api/tickets/1` (ক্লোজড টিকিট এডিট করার চেষ্টা) 
   ➡️ `400 Bad Request: Closed ticket cannot be updated`!

---

## 🏆 সম্পূর্ণ আর্কিটেকচার সামারি

আমরা একটি সাধারণ হ্যালো-ওয়ার্ল্ড অ্যাপ থেকে ধাপে ধাপে একটি পূর্ণাঙ্গ, স্কেলেবল ও সুরক্ষিত এন্টারপ্রাইজ রেস্ট এপিআই তৈরি করেছি:

| উপাদান | দায়িত্ব |
| :--- | :--- |
| **`AppModule`** | রুট মডিউল হিসেবে সমস্ত ফিচার মডিউলকে বেঁধে রাখা |
| **`TicketsModule`** | টিকিট ফিচারের স্বাধীন বাউন্ডারি নির্ধারণ |
| **`TicketsController`** | ইনকামিং রিকোয়েস্ট রিসিভ ও রাউট ম্যাপিং |
| **`TicketsService`** | মূল বিজনেস লজিক, ডাটাবেজ/মেমোরি ও ডোমেন রুলস |
| **`DTO`** | ক্লায়েন্টের পাঠানো ডেটার টাইপ কন্ট্রাক্ট ও কাঠামো |
| **`ValidationPipe`** | ইনকামিং ডেটা রানটাইমে ভ্যালিডেট ও অতিরিক্ত ফিল্ড রিজেক্ট করা |
| **`Middleware`** | ইনকামিং রিকোয়েস্ট লগ করা |
| **`Guard`** | রোল ও স্টাফ পারমিশন নিশ্চিত করা |
| **`Interceptor`** | রেসপন্স ডেটাকে কমন স্ট্রাকচারে রূপান্তর করা |

---
⬅️ [পূর্ববর্তী অধ্যায়: ০৯. ডোমেন অ্যাকশন, মিডলওয়্যার ও গার্ড](./09-domain-actions-middleware-and-guards.md) | 🏠 [Master Index এ ফিরে যান](./README.md)
