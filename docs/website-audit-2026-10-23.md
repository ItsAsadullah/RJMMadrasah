# ওয়েবসাইট পর্যালোচনা ও বাকি কাজ

রহিমা জান্নাত মহিলা মাদ্রাসা · ২৩ অক্টোবর ২০২৬ · পর্যালোচিত কমিট `e1d96ff`

ওয়েবসাইটের প্রধান মডিউলগুলো আছে এবং ডিপ্লয় হচ্ছে। তবে নিরাপদ ও নির্ভরযোগ্যভাবে ব্যবহার করতে তথ্যের অনুমতি, পরিচয় যাচাই, হিসাব এবং ফলাফলের কয়েকটি গুরুত্বপূর্ণ ত্রুটি আগে ঠিক করা দরকার। নতুন ডিজাইনের আগে এই কাজগুলো অগ্রাধিকার পাওয়া উচিত।

## যাচাইয়ের পরিধি ও ফলাফল

- রাউট তালিকায় ৪৯টি page পাওয়া গেছে। ভর্তি, শিক্ষার্থী, শিক্ষক, হাজিরা, রুটিন, পরীক্ষা, প্রমোশন, হিসাব, ব্যাকআপ এবং প্রকাশ্য কনটেন্টের প্রধান কোডপথ পর্যালোচনা করা হয়েছে; প্রতিটি পাতার প্রতিটি কাজ সম্পন্ন করে পরীক্ষা করা হয়নি।
- `src`-এর ১৩৪টি ফাইলে ESLint চালানো হয়েছে: **৩টি error, ৩টি warning**। তিনটি error পরীক্ষার বিস্তারিত পাতায়।
- পুরো পাওয়া test suite চালানো হয়েছে: **৪টি suite, ১৬টি test পাস**। এগুলো সীমিত unit test; end-to-end নিরাপত্তা বা হিসাবের পূর্ণ পরীক্ষা নয়।
- এই কমিটের `npm run build` আগের ধাপে সফল হয়েছে। GitHub-এর Vercel status-ও **success**। [ডিপ্লয়](https://vercel.com/itsasadullahs-projects/rjm-madrasah/8BpHPTSmsBbavD1sp2mT6QJUvyYV)
- লোকাল ও লাইভ সাইটে একই ১২টি ঠিকানা HTTP 200 দিয়েছে: `/`, `/about`, `/admission`, `/admission/apply`, `/contact`, `/notice`, `/gallery`, `/result`, `/chairman`, `/login`, `/robots.txt`, `/sitemap.xml`। এটি পেজ পাওয়া যাচ্ছে প্রমাণ করে; সব ফিচার কাজ করছে প্রমাণ করে না।
- ব্রাউজারে লাইভ যোগাযোগ পৃষ্ঠা এবং লোকাল হিসাব প্যানেল দেখা হয়েছে।
- `.env.local`-এ সংযুক্ত Supabase-এ নতুন client, public anon key এবং **কোনো user session ছাড়াই** সীমিত read-only পরীক্ষা হয়েছে। ব্যক্তিগত তথ্য বা পাসওয়ার্ডের মান প্রতিবেদনে রাখা হয়নি।
- কোনো শিক্ষার্থী, নম্বর, হাজিরা, পেমেন্ট, অনুমতি বা ডাটাবেসের কাঠামো পরিবর্তন করা হয়নি। লাইভ write permission ও RPC execution পরীক্ষা করা হয়নি।

## কী কী ইতিমধ্যে আছে

অনলাইন ভর্তি ও অপেক্ষমাণ আবেদন, শিক্ষার্থীর প্রোফাইল/সম্পাদনা/প্রিন্ট, তিনটি স্ট্যাটাস, শাখা-বিভাগ-শ্রেণি, শিক্ষক ব্যবস্থাপনা, রুটিন, সাধারণ হাজিরা, নম্বর এন্ট্রি, ফলাফল/ট্রান্সক্রিপ্ট, প্রমোশন, ফি নির্ধারণ/আদায়, শিক্ষক বেতন, খরচ, অনুদান, মওকুফ, রিপোর্ট, ব্যাকআপের UI এবং ওয়েবসাইটের কনটেন্ট/SEO সেটিংসের কাঠামো আছে। এগুলো সম্পূর্ণ নতুন করে বানানোর প্রয়োজন নেই; নিচের সংযোগ ও নির্ভরযোগ্যতার কাজ বাকি।

## অগ্রাধিকার

**P0 — সবার আগে:** তথ্যের গোপনীয়তা ও পরিচয় যাচাই।

**P1 — পরের জরুরি ধাপ:** টাকা, ফলাফল, হাজিরা, প্রমোশন, পুনরুদ্ধার এবং dependency-সংক্রান্ত ঝুঁকি।

**P2 — এরপর:** অসম্পূর্ণ যোগাযোগ ব্যবস্থা, সময়/লিংক/SEO এবং স্বয়ংক্রিয় মান যাচাই।

১৮টি কাজের প্যাকেট পাওয়া গেছে: **২টি P0, ১২টি P1, ৪টি P2**। একই সমস্যার সম্পর্কিত সংশোধন একসঙ্গে রাখা হয়েছে।

### S01 · P0 · লগইন ছাড়া ব্যক্তিগত ও আর্থিক ডেটা পড়া যায়

**যাচাই:** user session ছাড়া HEAD/count query-তে `students` ১৩১, `teachers` ১৭, `student_dues` ৪৫, `transactions` ৫ এবং `leave_applications` ২টি রেকর্ড দৃশ্যমান হয়েছে। পরীক্ষিত column selection-এ শিক্ষার্থীর `guardian_mobile`, `father_nid` এবং শিক্ষকের `password`-ও ছিল। HEAD ব্যবহারে রেকর্ডের আসল মান ডাউনলোড/প্রকাশ না করেই read access যাচাই হয়েছে।

**বাকি কাজ:** ব্যক্তিগত টেবিলে প্রকৃত role/ownership-ভিত্তিক RLS ও column access; প্রকাশ্য শিক্ষক পরিচিতির জন্য আলাদা নিরাপদ projection; প্রকাশ্য ফলাফলে প্রয়োজনীয় অল্প কিছু field। জন্মসনদ/NID-এর মতো ফাইলও আলাদা access control-এর আওতায় আনতে হবে। শুধু dashboard redirect যথেষ্ট নয়।

**সমাপ্তির শর্ত:** session ছাড়া ব্যক্তিগত তথ্য পড়া যাবে না; শিক্ষার্থী কেবল নিজের এবং শিক্ষক কেবল অনুমোদিত শ্রেণির তথ্য পাবেন। পাবলিক পেজ চলবে সীমিত নিরাপদ ডেটা দিয়ে।

প্রমাণ: [পাবলিক ফলাফলের student query](<D:/TechHat website/rahima-jannat-web/src/app/(public)/result/page.tsx:151>), [লগইন query](<D:/TechHat website/rahima-jannat-web/src/app/login/page.tsx:44>)। নীতিগত ভিত্তি: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)।

### S02 · P0 · শিক্ষক/শিক্ষার্থী লগইন ও অ্যাডমিন অনুমতি পূর্ণাঙ্গ নয়

**কোডে নিশ্চিত:** শিক্ষক password ব্রাউজারে তুলনা হয়; শিক্ষক ও শিক্ষার্থীর session হচ্ছে localStorage JSON। dashboard সেই JSON-এর id গ্রহণ করে। এটি server-verified authentication নয়। শিক্ষার্থী নিষ্ক্রিয় হলে নতুন login বন্ধ হয়, কিন্তু বিদ্যমান dashboard session-এ status পুনরায় পরীক্ষা নেই। Admin layout শুধু session আছে কি না দেখে, admin role যাচাই করে না। কয়েকটি server action-এও আলাদা role guard নেই।

**বাকি কাজ:** Supabase Auth বা সমমানের server-verified session, শিক্ষক password-এর নিরাপদ সংরক্ষণ ও যাচাই, admin/teacher/student role enforcement, session expiry/revocation, নিষ্ক্রিয় account-এর পুরোনো session বন্ধ করা। একই সঙ্গে browser client ও SSR client-এর session storage এক করতে হবে: এখন browser-এ সাধারণ supabase-js client, server-এ cookie-based SSR client ব্যবহৃত হচ্ছে। RLS কঠোর করার আগে এই সংযোগ ঠিক করা জরুরি।

প্রমাণ: [লগইন](<D:/TechHat website/rahima-jannat-web/src/app/login/page.tsx:53>), [শিক্ষক session](<D:/TechHat website/rahima-jannat-web/src/app/teacher/dashboard/page.tsx:47>), [শিক্ষার্থী session](<D:/TechHat website/rahima-jannat-web/src/app/student/dashboard/page.tsx:179>), [অ্যাডমিন layout](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/layout.tsx:29>), [server client](<D:/TechHat website/rahima-jannat-web/src/lib/supabase/server.ts:7>)। SSR নির্দেশনা: [Supabase cookie-based session](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)।

### S03 · P1 · ফি আদায়ের RPC-তে অনুমতি ও হিসাব যাচাই শক্ত করতে হবে

**কোডে নিশ্চিত, লাইভ execution যাচাই করা হয়নি:** migration-এ `process_fee_payments_bulk` হলো `SECURITY DEFINER`; function body-তে caller/role যাচাই নেই। client-এর পাঠানো paid amount, net amount, waiver, status ও user id সরাসরি ব্যবহার করে। বর্তমান due পড়ে হিসাব পুনর্গণনা বা সমসাময়িক দুই payment-এর lost update প্রতিরোধ স্পষ্ট নেই। লাইভ function/GRANT migration-এর সঙ্গে অভিন্ন কি না প্রশাসনিক access দিয়ে যাচাই বাকি।

**বাকি কাজ:** server-side role check, due ও student/branch সম্পর্ক যাচাই, টাকা পুনর্গণনা, row locking, এক transaction-এ লেখা, duplicate request ঠেকানোর idempotency এবং নিরাপদ receipt sequence। সব privileged RPC-র execute permission audit।

প্রমাণ: [RPC](<D:/TechHat website/rahima-jannat-web/supabase/migrations/20260604_accounts_rpc_fix.sql:1>), [client payment payload](<D:/TechHat website/rahima-jannat-web/src/components/dashboard/accounts/FeeCollection.tsx:435>)।

### S04 · P1 · শিক্ষক বেতন ও মূল হিসাবের অঙ্ক আলাদা হয়ে যেতে পারে

**কোডে নিশ্চিত:** একক বেতন দেওয়ার সময় আগে `transactions`, পরে `teacher_salaries`-এ আলাদা request হয়। দ্বিতীয়টি ব্যর্থ হলে প্রথমটি থেকে যায়। বেতন edit/delete শুধু salary record বদলায়; সংশ্লিষ্ট transaction বদলায় না। UI-তেও transaction আলাদা আপডেট করার কথা লেখা আছে।

**বাকি কাজ:** salary payment-এর সঙ্গে transaction id যুক্ত করা; create/edit/reversal এক transaction-এ করা; আগের mismatch শনাক্ত করার reconciliation report।

**সমাপ্তির শর্ত:** বেতন সংশোধনের পরে salary report, খরচ ও ledger একই অঙ্ক দেখাবে; ব্যর্থ payment অর্ধেক লেখা হবে না।

প্রমাণ: [পেমেন্ট](<D:/TechHat website/rahima-jannat-web/src/components/dashboard/accounts/TeacherSalary.tsx:127>), [ডিলিট](<D:/TechHat website/rahima-jannat-web/src/components/dashboard/accounts/TeacherSalary.tsx:237>), [সম্পাদনা](<D:/TechHat website/rahima-jannat-web/src/components/dashboard/accounts/TeacherSalary.tsx:262>)।

### S05 · P1 · নম্বর না থাকলেও প্রমোশনে পাস হচ্ছে

**পুনরুৎপাদিত:** বর্তমান `calculatePromotionLogic`-এ একটি পরীক্ষামূলক শিক্ষার্থী এবং খালি marks array দিলে ফল হয় `status: passed`, `new_roll: 1`। শুরুতেই সবাইকে passed ধরা হয়; নম্বর না থাকলে সেই অবস্থাই থেকে যায়।

**বাকি কাজ:** প্রয়োজনীয় সব বিষয়ের নম্বর আছে কি না যাচাই, absent/incomplete আলাদা রাখা, incomplete ফলাফলে automatic promotion বন্ধ করা।

প্রমাণ: [প্রাথমিক status](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/promotion/utils.ts:37>), [রোল বরাদ্দ](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/promotion/utils.ts:108>)।

### S06 · P1 · প্রমোশনে শাখা/বছর ও রোলের সামঞ্জস্য বাকি

**কোডে নিশ্চিত:** নির্বাচিত class থেকে শুধু নাম নিয়ে শিক্ষার্থী খোঁজা হয়; branch, academic year ও department দিয়ে সীমাবদ্ধ করা হয় না। ফলে একই নামের অন্য শাখা/বছরের শিক্ষার্থী ঢুকে যেতে পারে। প্রমোশন `roll_no` বদলায়, অথচ শিক্ষার্থী তালিকা আগে `roll_number` দেখায়। promotion log আগে লেখা হয়, student update পরে—একসঙ্গে rollback হয় না।

**বাকি কাজ:** class identity অনুযায়ী নির্ভুল scope, target class/branch যাচাই, একটিমাত্র authoritative roll field এবং log ও promotion-এর atomic save।

প্রমাণ: [শিক্ষার্থী নির্বাচন](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/promotion/actions.ts:57>), [প্রমোশন লেখা](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/promotion/actions.ts:107>), [রোল](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/promotion/actions.ts:132>)।

### S07 · P1 · ফলাফল প্রকাশের নিয়ন্ত্রণ কার্যকর নয়

**যাচাই:** সংযুক্ত database-এ `ongoing` পরীক্ষার ৩৪৭টি এবং `upcoming` পরীক্ষার ৩৪৫টি marks record session ছাড়া পড়া যায়—মোট **৬৯২টি**। public result page `is_active` দেখে, `status = published` শর্ত নেই।

**বাকি কাজ:** প্রকাশিত পরীক্ষার ফলাফলই public query/RLS-এ অনুমোদন; শিক্ষক/অ্যাডমিনের draft result আলাদা রাখা; publish/unpublish-এ permission ও audit trail।

প্রমাণ: [পরীক্ষা নির্বাচন](<D:/TechHat website/rahima-jannat-web/src/app/(public)/result/page.tsx:110>), [marks query](<D:/TechHat website/rahima-jannat-web/src/app/(public)/result/page.tsx:173>)।

### S08 · P1 · ফলাফলের grade/GPA এবং পুরোনো ফলাফল একরকম নয়

**পুনরুৎপাদিত:** public ফলাফলের বর্তমান function-এ `40/50` দিলে `GPA 2.00, grade C` আসে; ৫০ পূর্ণমানের ৮০% হিসাব করা হয় না। ছাত্র dashboard-এও subject pass mark না দেখে hard-coded 33 ব্যবহৃত হয়। public search বর্তমান class-এর সঙ্গে মিলিয়ে দেখে; প্রমোশনের পরে আগের class-এর ফলাফল খুঁজতে বাধা হতে পারে।

**বাকি কাজ:** প্রতিষ্ঠানের grading নিয়ম নির্ধারণ করে full_marks ও pass_marks অনুযায়ী একটি shared calculation, exam-time class/year snapshot, admin/public/print/student portal-এ একই ফলাফল। ৫০ ও ১০০ পূর্ণমান, অনুপস্থিতি, অসম্পূর্ণ নম্বর ও প্রমোশনের আগের ফলাফল নিয়ে regression test।

প্রমাণ: [GPA](<D:/TechHat website/rahima-jannat-web/src/app/(public)/result/page.tsx:36>), [বর্তমান class যাচাই](<D:/TechHat website/rahima-jannat-web/src/app/(public)/result/page.tsx:160>), [ছাত্র dashboard-এর pass mark](<D:/TechHat website/rahima-jannat-web/src/app/student/dashboard/page.tsx:338>)।

### S09 · P1 · নিষ্ক্রিয় শিক্ষার্থীর পুরোনো বকেয়া আদায়ের পথ নেই

**কোডে নিশ্চিত:** FeeCollection শিক্ষার্থী query-তে সবসময় `status = active`। ফলে কেউ চলে গেলে তথ্য ও বকেয়া থাকে, কিন্তু এই আদায় পাতায় শিক্ষার্থীকে নির্বাচন করা যায় না।

**বাকি কাজ:** আদায়/হিসাব দেখার সময় সব স্ট্যাটাসের শিক্ষার্থী খোঁজার সুযোগ; নতুন নিয়মিত ফি আরোপে শুধু উপযুক্ত সক্রিয় শিক্ষার্থী নির্বাচন। বিদায়ের তারিখ ও চূড়ান্ত বকেয়ার হিসাব দরকার কি না নির্ধারণ।

প্রমাণ: [FeeCollection](<D:/TechHat website/rahima-jannat-web/src/components/dashboard/accounts/FeeCollection.tsx:313>)।

### S10 · P1 · শিক্ষার্থী dashboard-এর হাজিরা বাস্তব নয়

**কোডে নিশ্চিত:** সবার জন্য present 19, absent 4, late 1, percentage 82 বসানো আছে। এগুলো `attendance` থেকে গণনা করা হচ্ছে না। বিষয়ভিত্তিক হাজিরাও স্পষ্টভাবে বন্ধ রাখা হয়েছে।

**বাকি কাজ:** নির্ধারিত মাস/সময়কাল অনুযায়ী প্রকৃত হাজিরা, ছুটি/বন্ধের দিনসহ শতকরা হিসাব; প্রয়োজন হলে subject attendance-এর schema ও UI শেষ করা।

প্রমাণ: [স্থির হাজিরা](<D:/TechHat website/rahima-jannat-web/src/app/student/dashboard/page.tsx:358>), [subject attendance বন্ধ](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/branches/[branchId]/[classId]/attendance/page.tsx:43>)।

### S11 · P1 · হাজিরা আপডেটে পুরোনো তথ্য হারানোর ঝুঁকি

**কোডে নিশ্চিত:** আগে পুরোনো হাজিরা delete, পরে নতুন insert করা হয়। insert ব্যর্থ হলে আগের রেকর্ড ফেরানোর ব্যবস্থা নেই; delete-এর error-ও পরীক্ষা করা হচ্ছে না।

**বাকি কাজ:** সঠিক unique key-তে upsert অথবা transaction-ভিত্তিক replacement; date/class/branch scope ও error handling; ব্যর্থতার সময় পুরোনো হাজিরা অক্ষত থাকার পরীক্ষা।

প্রমাণ: [হাজিরা সংরক্ষণ](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/branches/[branchId]/[classId]/attendance/page.tsx:156>)।

### S12 · P1 · ব্যাকআপ/রিস্টোরকে পূর্ণাঙ্গ ও নির্ভরযোগ্য করতে হবে

**কোডে নিশ্চিত:** backup তালিকায় ২৫টি table আছে, কিন্তু `departments`, `fee_types`, `student_waivers`, `teacher_salaries`, `leave_applications` এবং কয়েকটি website settings table নেই। pagination নেই—বড় dataset-এ server row limit-এর কারণে অসম্পূর্ণ backup হতে পারে। restore-এ সব object/array বাদ দেওয়া হয়, ফলে আসল JSONB-ও হারাতে পারে; `home_sections.additional_data` এমন একটি column। table restore ব্যর্থ হলেও শেষে success message দেখায়।

**বাকি কাজ:** সম্পূর্ণ schema-aware backup, pagination, JSON preservation, manifest/version, failure summary ও staging restore drill। Hosted backup/PITR বর্তমানে চালু আছে কি না এই পর্যালোচনায় যাচাই হয়নি।

প্রমাণ: [table তালিকা](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/settings/backup/page.tsx:36>), [backup query](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/settings/backup/page.tsx:104>), [restore](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/settings/backup/page.tsx:168>), [JSONB column](<D:/TechHat website/rahima-jannat-web/supabase/migrations/20260225_create_home_sections.sql:9>)।

### S13 · P1 · নির্ভরতাগুলোর নিরাপত্তা আপডেট দরকার

**স্ক্যান:** `npm audit --omit=dev`-তে **১৫টি vulnerable dependency entry**: ২ critical, ১০ high, ২ moderate, ১ low। সরাসরি dependency-র মধ্যে `next` ও `jspdf` critical, `xlsx` high হিসেবে এসেছে। এটি package advisory matching; সব advisory এই সাইটে exploitable—এমন পরীক্ষা বা দাবি করা হয়নি।

**বাকি কাজ:** ব্যবহৃত code path অনুযায়ী applicability যাচাই, patched version/প্রয়োজনে বিকল্প library, lockfile update, build ও PDF/Excel export regression test। `xlsx`-এর ক্ষেত্রে audit স্বয়ংক্রিয় fix দেয়নি; blind `npm audit fix --force` উপযুক্ত নয়।

প্রমাণ: [package.json](<D:/TechHat website/rahima-jannat-web/package.json:1>)। প্রকাশিত সূত্রের উদাহরণ: [SheetJS advisory](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6), [jsPDF advisory](https://github.com/advisories/GHSA-pqxr-3g65-p328)।

### S14 · P2 · যোগাযোগ ফর্ম শুধু দেখানো হচ্ছে

**কোড ও লাইভ UI-তে নিশ্চিত:** নাম/মোবাইল/ইমেইল/বার্তার field ও send button আছে, কিন্তু form-এ submit handler, API অথবা database save নেই।

**বাকি কাজ:** validated submit endpoint, spam/rate limiting, message storage অথবা নির্ধারিত email delivery, success/error feedback এবং প্রয়োজনে admin inbox।

প্রমাণ: [যোগাযোগ form](<D:/TechHat website/rahima-jannat-web/src/components/pages/ContactClient.tsx:146>)।

### S15 · P2 · বাংলাদেশের স্থানীয় তারিখ সর্বত্র ব্যবহার হচ্ছে না

**কোডে নিশ্চিত:** হাজিরা ও কয়েকটি পেমেন্টে `new Date().toISOString().split('T')[0]` ব্যবহার হয়। এটি UTC তারিখ; বাংলাদেশে রাত ১২টা থেকে ভোর ৬টার আগে আগের দিন হতে পারে।

**বাকি কাজ:** school timezone `Asia/Dhaka` ধরে date-only helper, browser/server-এ একই নিয়ম; দিন/মাস বদলানোর সীমায় test।

প্রমাণ: [শিক্ষক হাজিরা](<D:/TechHat website/rahima-jannat-web/src/app/teacher/dashboard/page.tsx:196>), [admin হাজিরা](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/branches/[branchId]/[classId]/attendance/page.tsx:45>)।

### S16 · P2 · কয়েকটি লিংক, SEO ও পুরোনো route পরিষ্কার করা দরকার

**যাচাই:** লাইভ contact-এর website link `https://rjmm.edu.bd/www.rjmm.edu.bd`-এ যাচ্ছে, যা 404 দেয়। `robots.ts`-এ `/(admin)/` disallow করা হয়েছে, কিন্তু প্রকৃত URL `/dashboard`। sitemap-এ `/chairman` নেই। `/student-dashboard` নামে একটি পুরোনো page শুধু heading দেখায়; আসল portal `/student/dashboard`।

**বাকি কাজ:** external URL normalize/validate, প্রকৃত private route-এ robots/noindex, sitemap হালনাগাদ এবং পুরোনো route redirect। robots দিয়ে access security হয় না; S01/S02 আলাদাভাবে ঠিক করতেই হবে।

প্রমাণ: [website link](<D:/TechHat website/rahima-jannat-web/src/components/pages/ContactClient.tsx:133>), [robots](<D:/TechHat website/rahima-jannat-web/src/app/robots.ts:10>), [sitemap](<D:/TechHat website/rahima-jannat-web/src/app/sitemap.ts:5>), [পুরোনো dashboard](<D:/TechHat website/rahima-jannat-web/src/app/(student)/student-dashboard/page.tsx:1>)।

### S17 · P2 · বিল্ড ছাড়াও স্বয়ংক্রিয় মান যাচাই দরকার

**স্ক্যান:** সব ১৬ test পাস করলেও গুরুত্বপূর্ণ বাস্তব ত্রুটি আছে। source lint-এ পরীক্ষার বিস্তারিত পাতায় ৩ error আছে। tracked `.github/workflows/` নেই। বর্তমান Vercel build সফল হওয়া এই পরীক্ষাগুলোকে বাধ্যতামূলক করে না।

**বাকি কাজ:** lint ত্রুটি ঠিক করা; CI-তে build, lint, unit tests ও dependency checks; login/role, admission approval, fee partial/full/retry, result publishing, promotion এবং backup restore-এর end-to-end test; প্রয়োজনীয় deployment/error monitoring যাচাই। Vercel account-এর বাইরের monitoring settings এখানে দেখা হয়নি।

প্রমাণ: [পরীক্ষার বিস্তারিত page](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/exams/[id]/page.tsx:174>), [print mutation](<D:/TechHat website/rahima-jannat-web/src/app/(admin)/dashboard/academic/exams/[id]/page.tsx:469>), [test script](<D:/TechHat website/rahima-jannat-web/package.json:6>)।

### S18 · P1 · Git credential সংরক্ষণ ঠিক করা দরকার

**লোকাল configuration-এ নিশ্চিত:** origin URL-এ credential inline আছে। tracked code/doc scan-এ GitHub token পাওয়া যায়নি। কোনো token-এর মান এই প্রতিবেদনে রাখা হয়নি।

**বাকি কাজ:** credential manager/নিরাপদ authentication-এ স্থানান্তর, remote URL পরিষ্কার করা এবং প্রয়োজন অনুযায়ী exposed credential revoke/rotate। এটি স্থানীয় tooling-এর কাজ; website runtime bug নয়।

## কাজ করার প্রস্তাবিত ক্রম

1. **তথ্য ও পরিচয়:** S01, S02, S03, S07, S18। আগে safe public views ও বাস্তব login প্রস্তুত করে তারপর RLS শক্ত করতে হবে, যাতে ভর্তি ও public pages অকারণে বন্ধ না হয়।
2. **টাকা ও রেকর্ডের সঠিকতা:** S04, S09, S11, S12। staging-এ transaction failure ও restore পরীক্ষা শেষে চালু করা।
3. **একাডেমিক ফলাফল:** S05, S06, S08, S10। shared grading এবং missing marks, branch/year ও roll-এর regression tests।
4. **রক্ষণাবেক্ষণ ও অসম্পূর্ণ সুবিধা:** S13–S17। Dependency-এর জরুরি প্রযোজ্য patch এই ধাপের জন্য অপেক্ষা না করে আগে করতে হবে।

## নিশ্চিত ত্রুটির বাইরে সম্ভাব্য বাড়তি সুবিধা

স্ট্যাটাস পরিবর্তনের তারিখ/কারণ/কার দ্বারা বদলেছে—এই history; বিদায়ী শিক্ষার্থীর ছাড়পত্র ও চূড়ান্ত হিসাব; SMS/email notification; শিক্ষক password reset; ভর্তি আবেদন spam protection; পূর্ণ mobile/print regression পরীক্ষা। এগুলো প্রয়োজন অনুযায়ী scope নির্ধারণ করার কাজ—সবগুলোকে বর্তমান নিশ্চিত bug হিসেবে গণনা করা হয়নি।

## যাচাই বাকি আছে

লাইভ database-এর সম্পূর্ণ RLS/GRANT/function definitions, backup/PITR settings, privileged RPC permission, production write flows, concurrent payment, restore drill, সব device-এ layout এবং private admin-role matrix। এগুলো staging বা প্রশাসনিক read-only access দিয়ে পরীক্ষা করা প্রয়োজন। কোনো missing administrative access-কে এই প্রতিবেদনে নিশ্চিত vulnerability হিসেবে ধরা হয়নি।

এই প্রতিবেদন একটি প্রমাণভিত্তিক অগ্রাধিকার তালিকা; শতভাগ নিরাপত্তা বা সব ফিচার সম্পূর্ণ পরীক্ষিত—এমন প্রত্যয়ন নয়।
