import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ftswrrnuygjfvnwanbuh.supabase.co',
    'sb_publishable_-wI6bPEP3EiJRkOHyLkV4w_QEdCGwUw'
);

const { data, error } = await supabase.from('memories').select('*');
console.log('=== memories table ===');
console.log('Error:', error);
console.log('Count:', data?.length);
if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    data.forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify({ id: row.id, date: row.date, title: row.title, text: row.text, mood: row.mood, img: row.img ? '(has img)' : '(no img)' }));
    });
} else {
    console.log('No data found in memories table');
}
