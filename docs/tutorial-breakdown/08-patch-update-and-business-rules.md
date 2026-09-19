# ০৮. PATCH আপডেট ও বিজনেস লজিক: `tsconfig` ট্র্যাপ ও সার্ভিস রুলস

এই অধ্যায়ে আমরা শিখবো আংশিক ডেটা আপডেটের জন্য কেন PATCH মেথড ব্যবহার করা হয়, TypeScript-এর একটি গোপন সেটিং কীভাবে অবজেক্ট আপডেট ভেঙে দেয়, এবং ইনপুট ভ্যালিডেশনের সাথে ডোমেন বিজনেস লজিকের পার্থক্য কী।

---

## ১. PUT বনাম PATCH: কোনটি কখন ব্যবহার করবেন?

- **PUT (সম্পূর্ণ প্রতিস্থাপন):** ক্লায়েন্টকে পুরো অবজেক্ট পাঠাতে হয়। যদি কোনো ফিল্ড বাদ পড়ে, তবে ডাটাবেজের আগের মান মুছে যাবে।
- **PATCH (আংশিক পরিবর্তন):** ক্লায়েন্ট শুধু সেই ফিল্ডগুলোই পাঠাবে যা সে বদলাতে চায় (যেমন: শুধুমাত্র প্রায়োরিটি পরিবর্তন করে `'LOW'` করা)।

হেল্পডেস্কে টিকিট এডিটের জন্য **PATCH** হলো সবচেয়ে উপযুক্ত পদ্ধতি: `PATCH /api/tickets/:id`।

---

## ২. `UpdateTicketDto` তৈরি

```bash
nest g class tickets/dto/update-ticket.dto --no-spec --flat
```

### DTO কোড:
```typescript
// src/tickets/dto/update-ticket.dto.ts
import { IsOptional, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subject?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

> 📌 **লক্ষ্য করুন:** `UpdateTicketDto`-তে কোনো `status` ফিল্ড রাখা হয়নি! কারণ ক্লায়েন্ট যেন সাধারণ এডিট এপিআই দিয়ে টিকিটের স্ট্যাটাস পরিবর্তন করতে না পারে।

---

## ৩. দ্য `tsconfig` ট্র্যাপ (`useDefineForClassFields`)

সার্ভিসে আমরা সাধারণত জাভাস্ক্রিপ্টের `Object.assign()` দিয়ে আগের টিকিটের উপর নতুন ফিল্ডগুলো বসিয়ে দিই:

```typescript
// src/tickets/tickets.service.ts
update(id: number, updateDto: UpdateTicketDto): Ticket {
  const ticket = this.findOne(id);
  Object.assign(ticket, updateDto); // ⬅️ আগের টিকিটের ওপর নতুন ফিল্ড বসানো
  return ticket;
}
```

### 💣 অদ্ভুত বাগ:
পোস্টম্যান থেকে আপনি শুধু প্রায়োরিটি পরিবর্তন করে রিকোয়েস্ট পাঠালেন:
```json
{ "priority": "LOW" }
```
**ফলাফল:** রেসপন্সে দেখা গেল প্রায়োরিটি তো পরিবর্তন হয়েছেই, সাথে টিকিটের আগের `subject` এবং `description` মুছে গিয়ে `undefined` হয়ে গেছে!

### কেন এমন ঘটলো?
আধুনিক TypeScript এবং ECMAScript স্ট্যান্ডার্ড অনুযায়ী ক্লাসের আন-ইনিশিয়ালাইজড ফিল্ডগুলো অবজেক্টের মধ্যে `undefined` প্রোপার্টি হিসেবে থেকে যায়। ফলে `Object.assign()` যখন চলে, সে টিকিটের আসল সাবজেক্টের উপর `undefined` বসিয়ে আগের ডেটা মুছে দেয়!

### সমাধান:
প্রজেক্ট রুটের [tsconfig.json](../../tsconfig.json)-এ `compilerOptions`-এর ভেতরে নিচের লাইনটি যোগ করে সার্ভার রিস্টার্ট দিতে হয়:

```json
{
  "compilerOptions": {
    "useDefineForClassFields": false
    // ...
  }
}
```
এখন ক্লায়েন্ট যে ফিল্ড পাঠাবে, শুধুমাত্র সেই ফিল্ডই DTO অবজেক্টে থাকবে। বাকি ফিল্ডগুলোর কোনো অস্তিত্ব থাকবে না এবং আগের ডেটা অক্ষত থাকবে।

---

## ৪. ইনপুট ভ্যালিডেশন বনাম বিজনেস রুলস

আমাদের ৩ নম্বর টিকিটটি সিড ডেটাতে আগে থেকেই `CLOSED` করা ছিল।

এখন পোস্টম্যানে যদি ৩ নম্বর টিকিটের সাবজেক্ট পরিবর্তন করার চেষ্টা করা হয়:
`PATCH /api/tickets/3`
```json
{ "subject": "New Title" }
```
- DTO বলবে: সাবজেক্ট স্ট্রিং, ভ্যালিডেশন পাস!
- কন্ট্রোলার বলবে: রিকোয়েস্ট ঠিক আছে!
- **কিন্তু আমাদের ব্যবসার নিয়ম (Business Rule) হলো: একবার ক্লোজ হয়ে যাওয়া টিকিট আর কখনো এডিট করা যাবে না!**

### এই সিদ্ধান্ত কে নেবে?
- ভ্যালিডেশন পাইপ এটি চেক করতে পারবে না, কারণ সে জানে না টিকিটের বর্তমান অবস্থা কী।
- কন্ট্রোলারেরও এটি জানার কথা নয়।
- **একমাত্র সার্ভিসই এই সিদ্ধান্ত নিতে পারে!**

```typescript
// src/tickets/tickets.service.ts
update(id: number, updateDto: UpdateTicketDto): Ticket {
  const ticket = this.findOne(id);

  // 🛑 বিজনেস রুল চেক:
  if (ticket.status === 'CLOSED') {
    throw new BadRequestException('Closed ticket cannot be updated');
  }

  Object.assign(ticket, updateDto);
  return ticket;
}
```

### এক্সেপশনের পার্থক্য মনে রাখুন:
- **`NotFoundException` (404):** রিসোর্সটি সার্ভারেই নেই।
- **`BadRequestException` (400):** রিসোর্সটি আছে, কিন্তু সিস্টেমের নিয়মের কারণে এই মুহূর্তে কাজটি করার অনুমতি নেই।

---
⬅️ [পূর্ববর্তী অধ্যায়: ০৭. ইনফ্রাস্ট্রাকচার ও পাবলিক ডেপ্লয়মেন্ট](./07-infrastructure-and-deployment.md) | ➡️ [পরবর্তী অধ্যায়: ০৯. ডোমেন অ্যাকশন, মিডলওয়্যার ও গার্ড](./09-domain-actions-middleware-and-guards.md)
