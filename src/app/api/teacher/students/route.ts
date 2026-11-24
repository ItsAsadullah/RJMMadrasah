import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: Request) {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const classId = new URL(request.url).searchParams.get('class_id');
    if (!classId || !/^[0-9a-f-]{36}$/i.test(classId)) return NextResponse.json({ error: 'Invalid class' }, { status: 400 });
    const service = createServiceClient();
    const { data: teacher } = await service.from('teachers').select('id').eq('auth_user_id', user.id).single();
    if (!teacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { data: assigned, error: assignmentError } = await service.from('routines').select('id').eq('teacher_id', teacher.id).eq('class_id', classId).limit(1);
    if (assignmentError || !assigned?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { data: cls } = await service.from('academic_classes').select('name,branch_id,department,academic_year').eq('id', classId).single();
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    let query = service.from('students').select('id,student_id,name_bn,roll_no,photo_url').eq('class_name', cls.name).eq('branch_id', cls.branch_id).eq('academic_year', cls.academic_year).eq('status', 'active');
    query = cls.department ? query.eq('department', cls.department) : query.is('department', null);
    const { data, error: queryError } = await query.order('roll_no');
    if (queryError) throw queryError;
    return NextResponse.json({ students: data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'শিক্ষার্থী লোড করা যায়নি।' }, { status: 500 }); }
}
