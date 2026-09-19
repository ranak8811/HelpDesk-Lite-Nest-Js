# ০৭. Pipes এবং Exception Filters (ইনপুট ফিল্টারিং ও সেন্ট্রালাইজড এরর হ্যান্ডলিং)

ইনপুট ডেটা ভ্যালিডেশন এবং সিস্টেমের এররগুলোকে সুন্দর ও প্রফেশনালভাবে হ্যান্ডেল করার জন্য NestJS-এ রয়েছে **Pipes** এবং **Exception Filters**। 

---

## ১. Pipes (পাইপ) কী এবং কেন ব্যবহার করা হয়?

**Pipe** হলো একটি ক্লাস যা **`PipeTransform`** ইন্টারফেস ইমপ্লিমেন্ট করে। পাইপের প্রধান কাজ দুটি:

1. **রূপান্তর (Transformation):** ইনপুট ডেটাকে কাঙ্ক্ষিত ফরম্যাটে কনভার্ট করা (যেমন: URL স্ট্রিং `"10"` কে আসল সংখ্যা `10`-এ রূপান্তর করা)।
2. **যাচাইকরণ (Validation):** ইউজারের পাঠানো ডেটা সঠিক কি না তা পরীক্ষা করা; ভুল থাকলে রিকোয়েস্ট থামিয়ে সঙ্গে সঙ্গে এরর দেওয়া।

### NestJS-এর জনপ্রিয় বিল্ট-ইন পাইপসমূহ:
- **`ValidationPipe`**: DTO এবং `class-validator` দিয়ে সম্পূর্ণ রিকোয়েস্ট বডি ভ্যালিডেট করে।
- **`ParseIntPipe`**: স্ট্রিংকে ইন্টিজারে রূপান্তর করে।
- **`ParseBoolPipe`**: স্ট্রিং `"true"` বা `"false"` কে আসল বুলিয়ানে রূপান্তর করে।
- **`ParseUUIDPipe`**: আইডিটি সঠিক UUID ফরম্যাটের কি না যাচাই করে।
- **`DefaultValuePipe`**: ইউজার কুয়েরি প্যারামিটার না পাঠালে ডিফল্ট মান বসায়।

### বাস্তব উদাহরণ (`ParseIntPipe`):
আমাদের [src/tickets/tickets.controller.ts](../src/tickets/tickets.controller.ts)-এ লেখা আছে:

```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  // এখানে id গ্যারান্টি সহকারে একটি আসল number!
  return this.ticketsService.findOne(id);
}
```

যদি কোনো ইউজার ভুল করে কল করে: `GET /api/tickets/abc`, তবে `ParseIntPipe` মেথডে ঢুকতেই দেবে না, তার আগেই চমৎকার রেসপন্স দেবে:
```json
{
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## ২. Exception Filters (এক্সেপশন ফিল্টার) কী এবং কেন প্রয়োজন?

NestJS অ্যাপ্লিকেশনের যেকোনো জায়গায় (Service, Controller, বা Database) যদি কোনো এরর থ্রো করা হয়, NestJS-এর একটি বিল্ট-ইন **Global Exception Filter** থাকে যা স্বয়ংক্রিয়ভাবে এররটি ধরে ফেলে।

কিন্তু ডিফল্ট এরর রেসপন্স অনেক সময় কাস্টমাইজড থাকে না। আপনার কোম্পানির জন্য যদি একটি নির্দিষ্ট এরর ফরম্যাট বজায় রাখতে চান, তখন **Custom Exception Filter** তৈরি করা হয়।

### বিল্ট-ইন HTTP Exceptions:
NestJS-এ এরর থ্রো করার জন্য অনেক সুন্দর সুন্দর ক্লাস তৈরি করাই আছে:
```typescript
throw new NotFoundException('এই আইডির কোনো টিকিট পাওয়া যায়নি!'); // 404
throw new BadRequestException('ইনপুট ডেটা সঠিক নয়!'); // 400
throw new UnauthorizedException('লগইন করা আবশ্যক!'); // 401
throw new ForbiddenException('আপনার এই টিকিট ডিলিট করার পারমিশন নেই!'); // 403
```

---

## ৩. কাস্টম গ্লোবাল এক্সেপশন ফিল্টার তৈরি

সব ধরনের এররকে এক ছাতার নিচে আনার জন্য একটি কাস্টম ফিল্টার:

```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // ফাঁকা রাখলে যেকোনো প্রকার এরর ধরবে
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'ইন্টারনাল সার্ভার সমস্যা, দয়া করে কিছুক্ষণ পর চেষ্টা করুন!';

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorDetails: message,
    });
  }
}
```

### গ্লোবালি অ্যাক্টিভেট করা:
[src/main.ts](../src/main.ts)-এ:
```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```

এখন আপনার অ্যাপ্লিকেশনে ডাটাবেজ ডাউন হোক বা কোনো ফাইল মিসিং হোক, সার্ভার ক্র্যাশ করবে না এবং ক্লায়েন্ট সবসময় একটি সুন্দর ও গোছানো JSON এরর রেসপন্স পাবে।

---

## ৪. পাইপ বনাম ফিল্টারের পার্থক্য

| বৈশিষ্ট্য | Pipes (পাইপ) | Exception Filters (ফিল্টার) |
| :--- | :--- | :--- |
| **লাইফসাইকেলের অবস্থান** | রিকোয়েস্টের শুরুতে (কন্ট্রোলারের আগে) | রিকোয়েস্টের শেষে (যদি কোনো এরর ঘটে) |
| **মূল কাজ** | ডেটা যাচাই করা ও টাইপ কনভার্ট করা | এরর ধরে সুন্দর রেসপন্স বানানো |
| **ইন্টারফেস** | `PipeTransform` (`transform(value, metadata)`) | `ExceptionFilter` (`catch(exception, host)`) |

---
⬅️ [পূর্ববর্তী গাইড: Interceptors এবং Logging](./06-interceptors-and-logging.md) | 🏠 [Master Index এ ফিরে যান](./README.md)
