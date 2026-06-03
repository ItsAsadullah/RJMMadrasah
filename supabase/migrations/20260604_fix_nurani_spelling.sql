-- 'নুরানী' বা 'নূরানী' এর আগে-পরে যদি কোনো স্পেস বা ট্যাব থাকে, সেটি ক্লিন করে সবগুলোকে একটি মাত্র স্টান্ডার্ড 'নূরানী' তে সেট করবে।
UPDATE public.students 
SET department = 'নূরানী' 
WHERE trim(department) IN ('নুরানী', 'নূরানী');

-- 'কিতাব' বিভাগের আগেও একটি ট্যাব (Tab) স্পেস আছে, সেটিও ক্লিন করা হলো।
UPDATE public.students 
SET department = 'কিতাব' 
WHERE trim(department) = 'কিতাব';

-- academic_classes টেবিল এর জন্যও স্পেস ক্লিন করা হলো
UPDATE public.academic_classes 
SET department = 'নূরানী' 
WHERE trim(department) IN ('নুরানী', 'নূরানী');

UPDATE public.academic_classes 
SET department = 'কিতাব' 
WHERE trim(department) = 'কিতাব';
