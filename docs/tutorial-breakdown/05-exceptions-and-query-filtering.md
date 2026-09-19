# ০৫. এক্সেপশন ও কোয়েরি ফিল্টারিং: NotFoundException এবং "The Banana Problem"

এই অধ্যায়ে আমরা শিখবো রিসোর্স না পাওয়া গেলে কীভাবে সঠিক HTTP স্ট্যাটাস কোড দিতে হয়, কোয়েরি প্যারামিটার দিয়ে ডেটা ফিল্টার করতে হয় এবং কেন টাইপস্ক্রিপ্ট টাইপ থাকা সত্ত্বেও রানটাইমে অদ্ভুত বাগ (যেমন "The Banana Problem") ঘটে।

---

## ১. রিসোর্স মিসিং ও `NotFoundException`

ধরে নিন কোনো ক্লায়েন্ট কল করলো:
`GET /api/tickets/999`

- `999` একটি বৈধ সংখ্যা, তাই `ParseIntPipe` কোনো বাধা দেবে না।
- কিন্তু আমাদের ডেটাবেজে ৯৯৯ আইডির কোনো টিকিট নেই। সার্ভিস `undefined` রিটার্ন করবে এবং ক্লায়েন্ট খালি বডি সহ `200 OK` পাবে।
- এটি ভুল API ডিজাইন। কোনো রিসোর্স না থাকলে অবশ্যই ক্লায়েন্টকে **`404 Not Found`** জানাতে হবে।

### সিদ্ধান্তটি কে নেবে?
কন্ট্রোলার নয়, **সার্ভিস এই সিদ্ধান্ত নেবে**—কারণ ডেটা কালেকশন একমাত্র সার্ভিসের কাছেই আছে।

```typescript
// src/tickets/tickets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TicketsService {
  findOne(id: number): Ticket {
    const ticket = this.tickets.find(t => t.id === id);

    if (!ticket) {
      // নেস্টের বিল্ট-ইন এক্সেপশন থ্রো করা
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }
}
```

### ফলাফল (Postman):
এখন `GET /api/tickets/999` পাঠালে কোনো ম্যানুয়াল স্ট্যাটাস কোড সেট করা ছাড়াই NestJS চমৎকার রেসপন্স দেবে:
```json
{
  "message": "Ticket with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## ২. কোয়েরি প্যারামিটার দিয়ে ফিল্টারিং (`@Query`)

আমরা চাই ক্লায়েন্ট নির্দিষ্ট স্ট্যাটাস বা প্রায়োরিটি দিয়ে টিকিট ফিল্টার করতে পারুক:
- `GET /api/tickets?status=OPEN`
- `GET /api/tickets?priority=HIGH`
- `GET /api/tickets?status=OPEN&priority=HIGH`

### কন্ট্রোলারে `@Query` ব্যবহার:
```typescript
// src/tickets/tickets.controller.ts
import { Controller, Get, Query } from '@nestjs/common';

@Get()
findAll(
  @Query('status') status?: Ticket['status'],
  @Query('priority') priority?: Ticket['priority'],
) {
  return this.ticketsService.findAll(status, priority);
}
```

### সার্ভিসে ফিল্টারিং লজিক:
```typescript
// src/tickets/tickets.service.ts
findAll(status?: Ticket['status'], priority?: Ticket['priority']): Ticket[] {
  let result = this.tickets;

  if (status) {
    result = result.filter(t => t.status === status);
  }

  if (priority) {
    result = result.filter(t => t.priority === priority);
  }

  return result;
}
```

---

## ৩. দ্য ব্যানানা প্রবলেম (The Banana Problem)

এখন পোস্টম্যানে এমন একটি রিকোয়েস্ট পাঠিয়ে দেখুন:
`GET http://localhost:3000/api/tickets?status=banana`

### ফলাফল:
- স্ট্যাটাস কোড: `200 OK`
- রেসপন্স: `[]` (খালি অ্যারে)

### কেন এটি একটি গুরুতর সমস্যা?
1. আমরা কন্ট্রোলারে টাইপস্ক্রিপ্টে লিখেছিলাম `status?: Ticket['status']` (অর্থাৎ শুধুমাত্র `'OPEN'` অথবা `'CLOSED'` আসতে পারে)।
2. কিন্তু ক্লায়েন্ট পাঠিয়েছে `"banana"`।
3. কোনো এরর আসেনি, বরং ক্লায়েন্ট ভাবছে ডাটাবেজে হয়তো কোনো টিকিটই নেই!
4. আসল বিষয় হলো: ক্লায়েন্ট ইনপুটে ভুল করেছে, আর সার্ভারের উচিত ছিল **`400 Bad Request`** দিয়ে ক্লায়েন্টকে জানানো: *"ব্যানানা কোনো বৈধ স্ট্যাটাস নয়, স্ট্যাটাস অবশ্যই OPEN বা CLOSED হতে হবে!"*

### কারণ:
আবারও সেই একই বাস্তব সত্য: **TypeScript রানটাইমে থাকে না।** ক্লায়েন্ট নেটওয়ার্ক দিয়ে যা ইচ্ছা তা পাঠাতে পারে।

এই ইনপুটকে রানটাইমে কঠোরভাবে যাচাই করার জন্যই পরবর্তী অধ্যায়ে আমাদের প্রয়োজন হবে **DTO (Data Transfer Object)** এবং **ValidationPipe**!

---
⬅️ [পূর্ববর্তী অধ্যায়: ০৪. টাইপ কন্ট্রাক্ট ও ডাইনামিক রাউটস](./04-interface-and-pipes.md) | ➡️ [পরবর্তী অধ্যায়: ০৬. DTO ও ভ্যালিডেশন পাইপলাইন](./06-dto-and-validation-pipeline.md)
