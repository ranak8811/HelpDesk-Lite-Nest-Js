# ০৪. টাইপ কন্ট্রাক্ট ও ডাইনামিক রাউটস: Runtime Type বনাম TypeScript Type

এই অধ্যায়ে আমরা শিখবো টাইপস্ক্রিপ্টের ইন্টারফেস কীভাবে ডেটার কাঠামো নিশ্চিত করে এবং কেন URL প্যারামিটার হ্যান্ডেল করার সময় `ParseIntPipe` ব্যবহার করা অপরিহার্য।

---

## ১. টাইপ কন্ট্রাক্ট: `Ticket` ইন্টারফেস তৈরি

আমাদের টিকিটের নির্দিষ্ট কিছু ফিল্ড থাকবে। এগুলোকে টাইপস্ক্রিপ্টের আওতায় আনার জন্য আমরা একটি ইন্টারফেস তৈরি করবো:

```bash
nest g interface tickets/ticket --flat
```
*(এখানে `--flat` ব্যবহার করা হয়েছে যেন `tickets/ticket/` নামে অতিরিক্ত ফোল্ডার না তৈরি হয়।)*

### ইন্টারফেসের কোড:
```typescript
// src/tickets/ticket.interface.ts
export interface Ticket {
  id: number;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'CLOSED';
  createdAt: string; // ISO 8601 UTC স্ট্রিং
}
```

### সার্ভিসে সিড ডেটা (Seed Data) বসানো:
[src/tickets/tickets.service.ts](../../src/tickets/tickets.service.ts)-এ আমরা ৩টি প্রাথমিক টিকিট রেখে দিচ্ছি:
- টিকিট ১ ও ২: `status: 'OPEN'`
- টিকিট ৩: `status: 'CLOSED'` *(পরবর্তীতে বিজনেস রুল টেস্ট করার সুবিধার্থে এটি আগে থেকেই ক্লোজ রাখা হয়েছে)*।

---

## ২. ডাইনামিক রুট: নির্দিষ্ট টিকিট খুঁজে আনা

আমাদের পরবর্তী রুট: `GET /api/tickets/:id` (যেমন: `/api/tickets/2`)।

### সার্ভিসের মেথড:
```typescript
// src/tickets/tickets.service.ts
findOne(id: number): Ticket | undefined {
  return this.tickets.find(ticket => ticket.id === id);
}
```

---

## ৩. দ্য রানটাইম স্ট্রিং ট্র্যাপ (The Silent Bug)

নতুনদের কোডে সবচেয়ে বেশি ঘটা একটি নীরব কিন্তু মারাত্মক বাগ:

```typescript
// কন্ট্রোলারের প্রাথমিক কোড
@Get(':id')
findOne(@Param('id') id: number) {
  return this.ticketsService.findOne(id);
}
```

### পোস্টম্যানে টেস্ট করে দেখুন:
- রিকোয়েস্ট: `GET http://localhost:3000/api/tickets/2`
- **ফলাফল:** স্ট্যাটাস কোড `200 OK`, কিন্তু রেসপন্স বডি **একদম খালি (`empty`)**! কোনো এরর বা লাল দাগ নেই!

### কেন এমন ঘটলো?
1. আপনি টাইপস্ক্রিপ্টে লিখেছেন `id: number`। কিন্তু মনে রাখবেন: **টাইপস্ক্রিপ্ট টাইপ শুধুমাত্র কোড লেখার সময় কাজ করে, রানটাইমে নয় (Type Erasure)।**
2. HTTP রিকোয়েস্ট যখন নেটওয়ার্ক দিয়ে সার্ভারে আসে, URL-এর প্রতিটি প্যারামিটার রানটাইমে খাঁটি **স্ট্রিং (`string`)** হিসেবে ঢোকে। অর্থাৎ `id` হলো `"2"` (স্ট্রিং), সংখ্যা `2` নয়!
3. সার্ভিসের ভেতরে যখন চেক করা হয়: `ticket.id === id` (অর্থাৎ `2 === "2"`), স্ট্রিক্ট ইকুয়ালিটির কারণে এটি `false` হয়ে যায়!
4. কোনো টিকিট খুঁজে না পাওয়ায় সার্ভিস `undefined` রিটার্ন করে, আর নেস্ট খালি বডি সহ `200 OK` পাঠিয়ে দেয়।

---

## ৪. সমাধান: `ParseIntPipe`-এর ম্যাজিক

এই সমস্যার নিখুঁত ও প্রফেশনাল সমাধান হলো NestJS-এর বিল্ট-ইন **`ParseIntPipe`** ব্যবহার করা:

```typescript
// src/tickets/tickets.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  // ParseIntPipe ইনকামিং স্ট্রিং "2" কে আসল সংখ্যা 2 বানিয়ে কন্ট্রোলারে পাঠাবে!
  return this.ticketsService.findOne(id);
}
```

### `ParseIntPipe` দুটি বিশাল কাজ করে:
1. **স্বয়ংক্রিয় টাইপ রূপান্তর (Transformation):** রিকোয়েস্ট কন্ট্রোলারে ঢোকার আগেই স্ট্রিং `"2"`-কে আসল সংখ্যা `2`-এ রূপান্তর করে দেয়।
2. **ইনপুট ভ্যালিডেশন (Validation):** যদি কোনো ইউজার ভুল ইউআরএল দেয়:
   - `GET /api/tickets/abc`
   - `ParseIntPipe` দেখবে `abc` কোনো সংখ্যা নয়। এটি মেথডে ঢুকতেই দেবে না, তার আগেই সঙ্গে সঙ্গে রিজেক্ট করে দেবে:
   ```json
   {
     "message": "Validation failed (numeric string is expected)",
     "error": "Bad Request",
     "statusCode": 400
   }
   ```

আপনাকে একটি লাইনও `isNaN(id)` লিখে ম্যানুয়াল ভ্যালিডেশন করতে হয়নি!

---
⬅️ [পূর্ববর্তী অধ্যায়: ০৩. সার্ভিস ও ডিপেনডেন্সি ইনজেকশন](./03-service-and-dependency-injection.md) | ➡️ [পরবর্তী অধ্যায়: ০৫. এক্সেপশন ও কোয়েরি ফিল্টারিং](./05-exceptions-and-query-filtering.md)
