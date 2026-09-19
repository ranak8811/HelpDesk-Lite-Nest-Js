# ০৪. Middleware এবং Guards (সুরক্ষা ও ফিল্টারিং)

NestJS-এ অ্যাপ্লিকেশনের নিরাপত্তা ও ইনকামিং ট্রাফিক নিয়ন্ত্রণে **Middleware** এবং **Guards** সবচেয়ে গুরুত্বপূর্ণ ভূমিকা পালন করে। 

অনেকেই প্রশ্ন করেন: *"মিডলওয়্যার দিয়ে তো সবই আটকানো যায়, তাহলে আবার আলাদা করে গার্ড (Guard) কেন দরকার?"* এই গাইডে তার পরিষ্কার উত্তর পাবেন।

---

## ১. Middleware (মিডলওয়্যার) কী এবং কীভাবে কাজ করে?

NestJS Middleware মূলত Express.js-এর মিডলওয়্যারের মতোই কাজ করে। এটি একটি সাধারণ ফাংশন বা ক্লাস যা রুট হ্যান্ডলারের কাছে রিকোয়েস্ট পৌঁছানোর **আগে** রান করে।

### এর দায়িত্ব:
- ইনকামিং রিকোয়েস্ট (`req`) এবং রেসপন্স (`res`) অবজেক্টে এক্সেস পাওয়া।
- রিকোয়েস্টের হেডার মডিফাই করা বা রিকোয়েস্ট লগ করা।
- `next()` ফাংশন কল করে পরবর্তী ধাপে পাঠানো (যদি `next()` কল না করা হয়, তবে রিকোয়েস্ট সেখানেই আটকে থাকবে)।

### বাস্তব কোড উদাহরণ (Logger Middleware):
```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${req.method}] ${req.originalUrl} - সময়: ${new Date().toLocaleTimeString()}`);
    next(); // পরবর্তী ধাপে যাওয়ার অনুমতি দেওয়া
  }
}
```

### মডিউলে মিডলওয়্যার যুক্ত করার নিয়ম:
```typescript
// app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('tickets'); // শুধুমাত্র /tickets রুটে এই মিডলওয়্যার কাজ করবে
  }
}
```

---

## ২. Guards (গার্ড) কী এবং কীভাবে কাজ করে?

**Guard** হলো একটি বিশেষ ক্লাস যা **`CanActivate`** ইন্টারফেস ইমপ্লিমেন্ট করে। এর একমাত্র দায়িত্ব হলো: **"এই রিকোয়েস্টটিকে কি ভেতরে ঢুকতে দেওয়া হবে, নাকি হবে না?"** তা নির্ধারণ করা।

### গার্ডের বৈশিষ্ট্য:
- গার্ডে একটি মাত্র মেথড থাকে: `canActivate(context: ExecutionContext)`.
- এটি রিটার্ন করে:
  - `true` ➡️ রিকোয়েস্ট ভেতরে যাওয়ার অনুমতি পায়।
  - `false` ➡️ NestJS স্বয়ংক্রিয়ভাবে ক্লায়েন্টকে `403 Forbidden` এরর পাঠিয়ে আটকে দেয়।

### বাস্তব কোড উদাহরণ (Auth / API Key Guard):
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('টোকেন বা অথরাইজেশন হেডার পাওয়া যায়নি!');
    }

    // টোকেন ভ্যালিডেশন লজিক
    return authHeader === 'Secret-Token-123';
  }
}
```

### কন্ট্রোলারে গার্ড ব্যবহারের নিয়ম:
```typescript
@Controller('tickets')
@UseGuards(AuthGuard) // এই কন্ট্রোলারের সব রুট AuthGuard দিয়ে সুরক্ষিত
export class TicketsController {
  // ...
}
```

---

## ৩. মিডলওয়্যার বনাম গার্ড: পার্থক্য কী এবং কেন গার্ড প্রয়োজন?

সবচেয়ে গুরুত্বপূর্ণ প্রশ্ন: **আমরা মিডলওয়্যার দিয়েই তো অথেন্টিকেশন চেক করতে পারতাম, গার্ড কেন বানানো হলো?**

| বৈশিষ্ট্য | Middleware (মিডলওয়্যার) | Guard (গার্ড) |
| :--- | :--- | :--- |
| **আর্কিটেকচার স্তর** | Express / HTTP ইঞ্জিনের একদম শুরুতে রান করে | NestJS ফ্রেমওয়ার্কের ভেতরে রান করে |
| **কোন রুট হ্যান্ডলার কল হচ্ছে তা জানা** | **অক্ষম** (জানে না কোন কন্ট্রোলার বা মেথড কল হতে যাচ্ছে) | **সক্ষম** (`ExecutionContext` দিয়ে জানে কোন মেথড কল হচ্ছে) |
| **কাস্টম মেটাডাটা পড়া (Reflector)** | পড়তে পারে না | পড়তে পারে (যেমন: `@Roles('ADMIN')`) |
| **প্রোটোকল সাপোর্ট** | শুধুমাত্র HTTP রিকোয়েস্টে কাজ করে | HTTP, WebSockets, এবং Microservices সব প্রোটোকলে কাজ করে |
| **প্রধান উদ্দেশ্য** | হেডার মডিফিকেশন, বডি পার্সিং, গ্লোবাল লগিং | Authentication (লগইন) এবং Authorization (পারমিশন) |

### বাস্তব উদাহরণ:
ধরুন আপনার একটি রুট আছে যা শুধু `ADMIN` দেখতে পারবে:
```typescript
@Get('admin-stats')
@Roles('ADMIN') // কাস্টম মেটাডাটা
@UseGuards(RolesGuard)
getStats() { ... }
```
মিডলওয়্যার কখনোই জানতে পারবে না যে মেথডের উপর `@Roles('ADMIN')` লেখা আছে। কিন্তু **Guard** সহজেই `Reflector` দিয়ে মেটাডাটা পড়ে রোল যাচাই করতে পারে!

---
⬅️ [পূর্ববর্তী গাইড: রিকোয়েস্ট লাইফসাইকেল](./03-request-lifecycle-overview.md) | ➡️ [পরবর্তী গাইড: ExecutionContext ও CallHandler](./05-execution-context-and-call-handler.md)
