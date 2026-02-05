
-- Create Fee Structures Table
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id BIGINT REFERENCES branches(id),
    class_name TEXT,
    department TEXT,
    category_id BIGINT REFERENCES categories(id), -- Income Category
    amount NUMERIC NOT NULL,
    frequency TEXT CHECK (frequency IN ('monthly', 'yearly', 'one_time')),
    academic_year INTEGER DEFAULT 2026,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Student Dues Table (The Ledger)
CREATE TABLE IF NOT EXISTS student_dues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    fee_structure_id UUID REFERENCES fee_structures(id),
    title TEXT, -- e.g. "January 2026 Tuition"
    amount NUMERIC NOT NULL, -- The original amount
    waiver NUMERIC DEFAULT 0, -- Discount
    fine NUMERIC DEFAULT 0, -- Late fee
    paid_amount NUMERIC DEFAULT 0,
    due_date DATE,
    status TEXT CHECK (status IN ('pending', 'partial', 'paid', 'overdue')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Reference in Transactions to link with Due (Optional but helpful)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_id UUID REFERENCES student_dues(id);

-- Add Trigger to update status automatically
CREATE OR REPLACE FUNCTION update_due_status() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.paid_amount >= (NEW.amount + NEW.fine - NEW.waiver) THEN
        NEW.status := 'paid';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status := 'partial';
    ELSE
        NEW.status := 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_due_status
BEFORE UPDATE ON student_dues
FOR EACH ROW
EXECUTE FUNCTION update_due_status();
