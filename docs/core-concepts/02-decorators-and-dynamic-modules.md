# ০২. Decorators এবং Dynamic Modules (forRoot / forFeature)

NestJS-এর কোড খুললেই সর্বত্র `@` চিহ্ন এবং মডিউলে `.forRoot(...)` দেখতে পাওয়া যায়। অনেকেই এগুলো না বুঝে শুধু কপি-পেস্ট করেন। এই গাইডে অত্যন্ত সহজ বাংলায় এগুলোর কার্যপ্রণালী ব্যাখ্যা করা হয়েছে।

---

## ১. Decorator (ডেকোরেটর) কী এবং এটি কীভাবে কাজ করে?

### সহজ ভাষায় Decorator কী?
ডেকোরেটর হলো একটি **বিশেষ ফাংশন**, যা কোনো ক্লাস, মেথড, প্রোপার্টি বা প্যারামিটারের মাথায় `@` চিহ্ন দিয়ে বসানো হয়। এর কাজ হলো মূল কোড পরিবর্তন না করে তার সাথে **অতিরিক্ত তথ্য (Metadata) বা ক্ষমতা** যোগ করে দেওয়া।

### বাস্তব উপমা:
ধরে নিন আপনার কাছে একটি সাধারণ খাম (Plain Class) আছে। আপনি তার গায়ে একটি স্টিকার লাগিয়ে দিলেন: **"জরুরি ও গোপনীয়"** (Decorator)। খামটি আগের মতোই আছে, কিন্তু স্টিকার লাগানোর কারণে পোস্ট অফিসের কর্মীরা এটিকে বিশেষ অগ্রাধিকার দিয়ে হ্যান্ডেল করবে।

---

### NestJS-এ বিভিন্ন প্রকার ডেকোরেটর:

```typescript
@Controller('tickets') // ১. Class Decorator: ক্লাসটিকে একটি কন্ট্রোলার হিসেবে চিহ্নিত করে
export class TicketsController {
  
  @Get(':id') // ২. Method Decorator: নির্দেশ করে এটি একটি HTTP GET রিকোয়েস্ট হ্যান্ডলার
  findOne(
    @Param('id') id: string, // ৩. Parameter Decorator: রিকোয়েস্ট URL থেকে 'id' প্যারামিটার টেনে এনে দেয়
    @Body() data: any        // Parameter Decorator: রিকোয়েস্ট বডি টেনে এনে দেয়
  ) {
    return this.service.findById(id);
  }
}
```

### ডেকোরেটরের পেছনের রহস্য (Under the Hood):
- TypeScript কম্পাইল হওয়ার সময় `@` চিহ্নের মাধ্যমে ক্লাসের সাথে কিছু **Metadata** (গোপন তথ্য) সেভ করে রাখে (`reflect-metadata` প্যাকেজের সাহায্যে)।
- যখন NestJS সার্ভার স্টার্ট হয়, ফ্রেমওয়ার্ক মেটাডাটাগুলো পড়ে জানতে পারে কোন মেথডের রুট কী (`/tickets/:id`), কোন মেথডটি GET আর কোন মেথডটি POST। আপনাকে ম্যানুয়ালি `app.get(...)` বা `app.post(...)` লিখতে হয় না!

---

## ২. Dynamic Modules কী? (Static Module বনাম Dynamic Module)

### ক) Static Module (সাধারণ মডিউল):
সাধারণ মডিউলে কনফিগারেশন আগে থেকেই ফিক্সড থাকে:
```typescript
@Module({
  imports: [TicketsModule], // ফিক্সড, কোনো কনফিগারেশন পাঠানো যায় না
})
export class AppModule {}
```

### খ) Dynamic Module (ডাইনামিক মডিউল):
অনেক সময় একটি মডিউল ব্যবহার করার সময় আমাদের কিছু সেটিংস বা কনফিগারেশন পাস করতে হয় (যেমন: ডাটাবেজের ইউজারনেম/পাসওয়ার্ড, API Key ইত্যাদি)। 

যে মডিউল **ফাংশন কলের মাধ্যমে কাস্টম কনফিগারেশন গ্রহণ করতে পারে**, তাকে **Dynamic Module** বলে।

---

## ৩. `forRoot()`, `forFeature()` এবং `forRootAsync()` এর পূর্ণাঙ্গ ব্যাখ্যা

### ১) `forRoot()` কী এবং কখন ব্যবহার হয়?
`forRoot()` হলো একটি স্ট্যাটিক মেথড যা একটি ডাইনামিক মডিউল কনফিগার করে রিটার্ন করে।

- **কখন ব্যবহার হয়:** অ্যাপ্লিকেশন স্তরে একবারের জন্য কোনো গ্লোবাল সেটিংস কনফিগার করার জন্য।
- **নিয়ম:** এটি সাধারণত শুধুমাত্র আপনার রুট মডিউলে (`AppModule`) **একবারই কল করা হয়**।

#### বাস্তব উদাহরণ:
আমাদের প্রজেক্টের [src/app.module.ts](../src/app.module.ts)-এ ছিল:
```typescript
ObserveModule.forRoot({
  appKey: 'YOUR_APP_KEY',
  appSecret: 'YOUR_APP_SECRET',
  serviceId: 'helpdesk-lite',
})
```
কিংবা ডাটাবেজ কানেকশনের জন্য:
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'rootpassword',
  database: 'helpdesk',
})
```
এখানে `forRoot()` মেথডটি পুরো অ্যাপ্লিকেশনের জন্য একটিমাত্র ডাটাবেজ কানেকশন পুল তৈরি করে দেয়।

---

### ২) `forFeature()` কী এবং কেন লাগে?
`forRoot()` দিয়ে মডিউলটি একবার গ্লোবালি কনফিগার করার পর, অ্যাপ্লিকেশনের নির্দিষ্ট কোনো সাব-মডিউলে কেবল নির্দিষ্ট ফিচার রেজিস্ট্রেশন করার জন্য `forFeature()` ব্যবহার করা হয়।

#### বাস্তব উদাহরণ:
```typescript
// tickets.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]), // শুধুমাত্র Ticket এন্টিটি এই মডিউলে আনো
  ],
})
export class TicketsModule {}
```
এখানে ডাটাবেজ কানেকশন আগেই `forRoot()` দিয়ে তৈরি হয়েছে, `forFeature([Ticket])` শুধু বলছে: *"এই মডিউলের ভেতরে Ticket টেবিলের রিপোজিটরি ব্যবহার করতে দাও।"*

---

### ৩) `forRootAsync()` কেন প্রয়োজন?
`forRoot()` সরাসরি স্ট্যাটিক অবজেক্ট নেয়। কিন্তু অনেক সময় ডাটাবেজের পাসওয়ার্ড বা সিক্রেট কি আমাদের `.env` ফাইল বা কনফিগ সার্ভিস থেকে অ্যাসিনক্রোনাসলি পড়তে হয়। তখন `forRootAsync()` ব্যবহার করা হয়:

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
  }),
})
```

---

## ৪. সংক্ষেপে দ্রুত মনে রাখার টেবিল

| মেথড | কোথায় ব্যবহার করবেন | উদ্দেশ্য |
| :--- | :--- | :--- |
| **`forRoot()`** | শুধুমাত্র `AppModule`-এ (Root Level) | পুরো অ্যাপ্লিকেশনের জন্য গ্লোবাল কনফিগারেশন সেট করা |
| **`forFeature()`** | নির্দিষ্ট ফিচার মডিউলে (Feature Level) | নির্দিষ্ট টেবিল বা রিসোর্স নির্দিষ্ট মডিউলে রেজিস্টার করা |
| **`forRootAsync()`** | `AppModule`-এ (যখন Env/Config লাগে) | অ্যাসিনক্রোনাসলি ডাইনামিক কনফিগারেশন লোড করা |

---
⬅️ [পূর্ববর্তী গাইড: Module, Controller & Service](./01-architecture-module-controller-service.md) | ➡️ [পরবর্তী গাইড: রিকোয়েস্ট লাইফসাইকেল](./03-request-lifecycle-overview.md)
