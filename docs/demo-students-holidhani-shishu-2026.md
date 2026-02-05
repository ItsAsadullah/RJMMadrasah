# ডেমো শিক্ষার্থী (হলিধানী / ২০২৬ / শিশু)

এই ডেমো ডাটাগুলো Supabase migration হিসেবে যোগ করা হয়েছে:
- `supabase/migrations/20260203_add_demo_students_holidhani_2026_shishu.sql`

## কী হবে
- হলিধানী শাখা (নাম `%হলিধানী%` ম্যাচ) না থাকলে `হলিধানী বাজার` নামে শাখা তৈরি হবে
- `academic_classes` এ `শিশু` (2026) ক্লাস না থাকলে তৈরি হবে
- `students` টেবিলে ২০ জন শিক্ষার্থী যোগ হবে (status=`active`, roll_no=1..20)

## কীভাবে রান করবেন
### Supabase Dashboard (Recommended)
1) Supabase Dashboard → SQL Editor
2) `20260203_add_demo_students_holidhani_2026_shishu.sql` ফাইলের কনটেন্ট কপি করে রান করুন

### Supabase CLI (যদি প্রজেক্ট লোকালি লিঙ্ক করা থাকে)
1) `supabase db push` (বা আপনার সেটআপ অনুযায়ী migration রান করুন)

## ভেরিফাই
Supabase SQL Editor এ রান করুন:
```sql
select student_id, name_bn, class_name, roll_no, branch_id, academic_year, status
from students
where academic_year = 2026
  and class_name = 'শিশু'
order by roll_no;
```
