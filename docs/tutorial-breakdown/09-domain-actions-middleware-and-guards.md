# ০৯. ডোমেন অ্যাকশন, মিডলওয়্যার ও গার্ড: নিরাপত্তা ও সিকোয়েন্স

এই অধ্যায়ে আমরা শিখবো সাধারণ ফিল্ড এডিটের সাথে ডোমেন অ্যাকশনের পার্থক্য, কেন ক্রস-কাটিং লগিংয়ের জন্য মিডলওয়্যার সেরা, এবং নির্দিষ্ট অ্যাকশন সুরক্ষিত করার জন্য কেন গার্ড ব্যবহার করা হয়।

---

## ১. ডোমেন অ্যাকশন বনাম সাধারণ আপডেট

সফটওয়্যার ডিজাইনে **টিকিট ক্লোজ করা** কোনো সাধারণ ফিল্ড এডিট নয়। 
- এটি একটি গুরুত্বপূর্ণ ব্যবসায়িক ইভেন্ট (Domain Action)। 
- এর নিজস্ব কঠোর নিয়ম রয়েছে: টিকিটটি আগে থেকেই ক্লোজ থাকা যাবে না, এবং শুধুমাত্র অনুমোদিত স্টাফরাই এটি করতে পারবে।

তাই বডিতে `{ status: 'CLOSED' }` পাঠানোর বদলে আমরা একটি সম্পূর্ণ পৃথক ও ডেডিকেটেড এন্ডপয়েন্ট তৈরি করবো:
`PATCH /api/tickets/:id/close`

### সুবিধা:
কোনো বডি ডাটা পাঠাতে হয় না। ক্লায়েন্টের উদ্দেশ্য URL দেখেই পরিষ্কার বোঝা যায়।

### সার্ভিসের কোড:
```typescript
// src/tickets/tickets.service.ts
closeTicket(id: number): Ticket {
  const ticket = this.findOne(id); // টিকিট না থাকলে অটোমেটিক 404

  if (ticket.status === 'CLOSED') {
    throw new BadRequestException('Ticket is already closed');
  }

  ticket.status = 'CLOSED';
  return ticket;
}
```

---

## ২. রিকোয়েস্ট লগার মিডলওয়্যার (Logging Middleware)

আমরা চাই টিকিটের যেকোনো রিকোয়েস্ট আসলেই টার্মিনালে তার মেথড ও পাথ লগ হোক:
`[GET] /api/tickets`
`[PATCH] /api/tickets/1/close`

### কেন কন্ট্রোলারে `console.log` লিখবেন না?
কন্ট্রোলারের প্রতিটি মেথডে কনসোল লগ লিখলে কোড পুনরাবৃত্তি হয় (DRY নীতি লঙ্ঘন)। এই ধরনের সাধারণ ইনকামিং কাজের জন্য **Middleware** উপযুক্ত।

### মিডলওয়্যার তৈরি:
```bash
nest g middleware common/request-logger --no-spec --flat
```
*(এটি `src/common/` ফোল্ডারে তৈরি করা হয়েছে কারণ লগিং পুরো অ্যাপ্লিকেশনের শেয়ার্ড বিষয়।)*

```typescript
// src/common/request-logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next(); // ⚠️ এটি কল না করলে রিকোয়েস্ট এখানেই চিরতরে আটকে থাকবে!
  }
}
```

### মডিউলে স্কোপ নির্ধারণ:
[src/tickets/tickets.module.ts](../../src/tickets/tickets.module.ts)-এ মিডলওয়্যারটি শুধু টিকিট রুটের জন্য যুক্ত করা হয়:
```typescript
export class TicketsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes(TicketsController);
  }
}
```

---

## ৩. স্টাফ অথরাইজেশন গার্ড (`StaffGuard`)

আমরা চাই সাধারণ ইউজাররা টিকিট দেখতে ও বানাতে পারলেও, টিকিট ক্লোজ করার সেন্সিটিভ কাজ শুধু অভ্যন্তরীণ স্টাফরা করতে পারবে।
- আমরা হেডারে চেক করবো: `x-staff-key: helpdesk-staff-secret`।

### কেন মিডলওয়্যারের বদলে Guard?
- মিডলওয়্যার সাধারণ রিকোয়েস্টের শুরুতে চলে; সে জানে না কোন নির্দিষ্ট মেথড বা হ্যান্ডেলারে রিকোয়েস্ট যাচ্ছে।
- কিন্তু **Guard** জানে কোন মেথড কল হতে যাচ্ছে এবং এটি বিশেষভাবে অথরাইজেশন ফিল্টার করার জন্যই তৈরি।

### গার্ড তৈরি:
```bash
nest g guard tickets/guards/staff --no-spec --flat
```

```typescript
// src/tickets/guards/staff.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const staffKey = req.headers['x-staff-key'];

    if (staffKey !== 'helpdesk-staff-secret') {
      throw new ForbiddenException('Staff access required');
    }

    return true; // এক্সেস দেওয়া হলো
  }
}
```

### কন্ট্রোলারে নির্দিষ্ট রুটে গার্ড লাগানো:
```typescript
// src/tickets/tickets.controller.ts
@Patch(':id/close')
@UseGuards(StaffGuard) // ⬅️ শুধুমাত্র এই নির্দিষ্ট রুটের জন্য গার্ড কাজ করবে
closeTicket(@Param('id', ParseIntPipe) id: number) {
  return this.ticketsService.closeTicket(id);
}
```

---

## ৪. সিকিউরিটি সিকোয়েন্স টেস্ট (The Mindset Shift)

একটি চমৎকার টেস্ট দিয়ে আর্কিটেকচারের সৌন্দর্য বোঝা যায়:

পোস্টম্যানে হেডার ছাড়া এমন একটি অবাস্তব আইডিতে কল করুন যা ডেটাবেজেই নেই:
`PATCH http://localhost:3000/api/tickets/999/close`

### রেসপন্স কী আসবে? `404 Not Found` নাকি `403 Forbidden`?
**আউটপুট:** `403 Forbidden`!

### কেন 404 এর আগেই 403 এলো?
কারণ NestJS-এর রিকোয়েস্ট পাইপলাইনে **Guard চলে সার্ভিসের আগে!** 
যেহেতু ইউজারের পারমিশনই নেই, তাই সিস্টেম সার্ভিসের ভেতরে ঢুকে ৯৯৯ নম্বর টিকিটটি আছে কি নেই তা পরীক্ষা করার অপচয়টুকুও করেনি! সিকিউরিটি গেটেই রিকোয়েস্টকে আটকে দিয়েছে।

---
⬅️ [পূর্ববর্তী অধ্যায়: ০৮. PATCH আপডেট ও বিজনেস লজিক](./08-patch-update-and-business-rules.md) | ➡️ [পরবর্তী অধ্যায়: ১০. ইন্টারসেপ্টর ও ফাইনাল রি-ডেপ্লয়মেন্ট](./10-interceptors-and-final-deployment.md)
