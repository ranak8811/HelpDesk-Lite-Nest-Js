# ০৬. Interceptors এবং Logging (রেসপন্স রূপান্তর ও সময় পরিমাপ)

NestJS-এর অন্যতম শক্তিশালী ফিচার হলো **Interceptor** এবং ফ্রেমওয়ার্কের নিজস্ব **Logger System**। এই গাইডে বাস্তব উদাহরণ সহ দেখানো হয়েছে কীভাবে এগুলো দিয়ে একটি প্রফেশনাল API তৈরি করা যায়।

---

## ১. Interceptor কী এবং এটি কেন ব্যবহার করা হয়?

**Interceptor** হলো একটি বিশেষ ক্লাস যা Aspect-Oriented Programming (AOP) টেকনিক অনুসরণ করে।

### ইন্টারসেপ্টরের প্রধান ৫টি ক্ষমতা:
1. **রিকোয়েস্টের আগে এবং পরে লজিক চালানো:** মেথড রান হওয়ার আগে প্রস্তুতি নেওয়া এবং রান হওয়ার পর রেসপন্স মডিফাই করা।
2. **রেসপন্স ডাটা রূপান্তর করা (Transform Data):** সব API রেসপন্সকে একটি স্ট্যান্ডার্ড ফরম্যাটে মোড়ানো (যেমন: `{ success: true, data: [...] }`)।
3. **এক্সেকিউশন টাইম পরিমাপ করা (Performance Profiling):** কোনো API কল শেষ হতে ডাটাবেজ সহ কত মিলি-সেকেন্ড সময় নিলো তা বের করা।
4. **ক্যাশিং (Caching):** মেথড রান না করে ক্যাশ মেমোরি থেকে সরাসরি রেজাল্ট ফিরিয়ে দেওয়া।
5. **টাইমআউট হ্যান্ডলিং:** রিকোয়েস্ট ৫ সেকেন্ডের বেশি সময় নিলে স্বয়ংক্রিয়ভাবে ক্যানসেল করে দেওয়া।

---

## ২. বাস্তব উদাহরণ ১: Logging ও Performance Interceptor

নিচের ইন্টারসেপ্টরটি প্রতিটি API কলের গতি (execution duration) নিখুঁতভাবে হিসেব করে লগ করবে:

```typescript
// src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now(); // রিকোয়েস্ট শুরু হওয়ার টাইমস্ট্যাম্প

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now; // কতক্ষণ সময় লাগলো
        this.logger.log(`[${method}] ${url} - সম্পন্ন হয়েছে +${duration}ms-এ`);
      }),
    );
  }
}
```

### এটি গ্লোবালি সেটআপ করার নিয়ম:
[src/main.ts](../src/main.ts)-এ:
```typescript
app.useGlobalInterceptors(new LoggingInterceptor());
```

এখন যেকোনো রুট হিট হলে কনসোলে স্বয়ংক্রিয়ভাবে এমন কালারফুল লগ আসবে:
```bash
[HTTP] [GET] /api/tickets - সম্পন্ন হয়েছে +12ms-এ
[HTTP] [POST] /api/tickets - সম্পন্ন হয়েছে +45ms-এ
```

---

## ৩. বাস্তব উদাহরণ ২: Standard Response Transform Interceptor

অনেক ক্লায়েন্ট টিম বা মোবাইল অ্যাপ টিম চায় যেন প্রতিটি API রেসপন্সের চেহারা দেখতে একই রকম হয়:

```typescript
// src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map(data => ({
        success: true,
        statusCode: res.statusCode,
        data: data, // আপনার কন্ট্রোলার যা রিটার্ন করেছিল
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### ফলাফল:
কন্ট্রোলার থেকে যদি শুধু একটি টিকিট অবজেক্ট রিটার্ন করেন, ক্লায়েন্ট স্বয়ংক্রিয়ভাবে পাবে:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "title": "Login Issue"
  },
  "timestamp": "2026-09-19T00:40:00.000Z"
}
```

---

## ৪. NestJS-এ Logging: কেন `console.log` ব্যবহার করবেন না?

অনেকেই লগের জন্য `console.log("Something")` লেখেন। কিন্তু এন্টারপ্রাইজ সিস্টেমে এটি পরিহার করা উচিত।

### কেন NestJS-এর নিজস্ব `Logger` ব্যবহার করবেন?
1. **টাইমস্ট্যাম্প ও প্রসেস আইডি:** লগটি কখন ঘটেছে এবং কোন সার্ভার থ্রেডে ঘটেছে তা পরিষ্কার থাকে।
2. **কনটেক্সট ট্যাগিং:** লগের শুরুতে ব্র্যাকেটে ক্লাসের নাম থাকে (যেমন: `[TicketsService]`), যাতে সহজে ফাইল চেনা যায়।
3. **লগ লেভেলস (Log Levels):** `log`, `error`, `warn`, `debug`, `verbose` আলাদা আলাদা রঙের হয়ে প্রদর্শিত হয়।
4. **প্রোডাকশন সেটিং:** প্রোডাকশনে চাইলে কোড পরিবর্তন না করেই শুধু এক লাইনে `debug` লেভেলের লগ বন্ধ করে দেওয়া যায়।

### সার্ভিস ক্লাসে লগার ব্যবহারের সঠিক নিয়ম:
```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TicketsService {
  // ক্লাসের নাম দিয়ে লগার তৈরি
  private readonly logger = new Logger(TicketsService.name);

  createTicket(dto: any) {
    this.logger.log(`নতুন টিকিট তৈরি করা হচ্ছে: ${dto.title}`);

    try {
      // ডাটাবেজ অপারেশন...
    } catch (error) {
      this.logger.error('টিকিট তৈরি করতে গিয়ে ত্রুটি ঘটেছে!', error.stack);
    }
  }
}
```

---
⬅️ [পূর্ববর্তী গাইড: ExecutionContext ও CallHandler](./05-execution-context-and-call-handler.md) | ➡️ [পরবর্তী গাইড: Pipes এবং Exception Filters](./07-pipes-and-exception-filters.md)
